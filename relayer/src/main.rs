use std::net::SocketAddr;

use http_body_util::{BodyExt, Full};
use hyper::body::Bytes;
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{Method, Request, Response, StatusCode};
use hyper_util::rt::TokioIo;
use serde::{Deserialize, Serialize};
use tokio::net::TcpListener;

#[derive(Debug, Deserialize, Serialize)]
struct ProofData {
    proof: String,
    #[serde(rename = "publicInputs")]
    public_inputs: Vec<String>,
}

#[derive(Debug, Deserialize, Serialize)]
struct ProofPayload {
    proof: ProofData,
    payload: Vec<String>,
}

fn is_valid_hex(s: &str) -> bool {
    if s.is_empty() {
        return true; // Empty strings like "0x" are valid
    }

    // Check if starts with 0x
    if !s.starts_with("0x") {
        return false;
    }

    // Check if rest are hex characters
    s[2..].chars().all(|c| c.is_ascii_hexdigit())
}

async fn handle_request(
    req: Request<hyper::body::Incoming>,
) -> Result<Response<Full<Bytes>>, Box<dyn std::error::Error + Send + Sync>> {
    let path = req.uri().path();

    match (req.method(), path) {
        (&Method::POST, "/tx") => {
            // Read the entire body
            let whole_body = req.collect().await?.to_bytes();

            // Parse JSON
            let proof_payload: ProofPayload = match serde_json::from_slice(&whole_body) {
                Ok(payload) => payload,
                Err(e) => {
                    let mut response =
                        Response::new(Full::new(Bytes::from(format!("Invalid JSON: {}", e))));
                    *response.status_mut() = StatusCode::BAD_REQUEST;
                    return Ok(response);
                }
            };

            println!("=== Received Proof Payload ===\n");

            // Validate and print proof
            println!("PROOF DATA:");
            println!("  proof: {}", proof_payload.proof.proof);
            if !is_valid_hex(&proof_payload.proof.proof) {
                let mut response =
                    Response::new(Full::new(Bytes::from("Invalid hex format in proof.proof")));
                *response.status_mut() = StatusCode::BAD_REQUEST;
                return Ok(response);
            }

            // Validate and print public inputs
            println!("\nPUBLIC INPUTS:");
            for (i, input) in proof_payload.proof.public_inputs.iter().enumerate() {
                println!("  [{}]: {}", i, input);
                if !is_valid_hex(input) {
                    let mut response = Response::new(Full::new(Bytes::from(format!(
                        "Invalid hex format in publicInputs[{}]",
                        i
                    ))));
                    *response.status_mut() = StatusCode::BAD_REQUEST;
                    return Ok(response);
                }
            }

            // Validate and print payload
            println!("\nPAYLOAD:");
            for (i, item) in proof_payload.payload.iter().enumerate() {
                println!("  [{}]: {}", i, item);
                if !is_valid_hex(item) {
                    let mut response = Response::new(Full::new(Bytes::from(format!(
                        "Invalid hex format in payload[{}]",
                        i
                    ))));
                    *response.status_mut() = StatusCode::BAD_REQUEST;
                    return Ok(response);
                }
            }

            println!("\n=== All parameters validated successfully ===\n");

            Ok(Response::new(Full::new(Bytes::from("okay"))))
        }
        (&Method::GET, "/") => Ok(Response::new(Full::new(Bytes::from("Relayer is running")))),
        _ => {
            let mut response = Response::new(Full::new(Bytes::from("Not Found")));
            *response.status_mut() = StatusCode::NOT_FOUND;
            Ok(response)
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));

    // We create a TcpListener and bind it to 127.0.0.1:3000
    let listener = TcpListener::bind(addr).await?;

    println!("Relayer server listening on http://{}", addr);

    // We start a loop to continuously accept incoming connections
    loop {
        let (stream, _) = listener.accept().await?;

        // Use an adapter to access something implementing `tokio::io` traits as if they implement
        // `hyper::rt` IO traits.
        let io = TokioIo::new(stream);

        // Spawn a tokio task to serve multiple connections concurrently
        tokio::task::spawn(async move {
            // Finally, we bind the incoming connection to our handler service
            if let Err(err) = http1::Builder::new()
                // `service_fn` converts our function in a `Service`
                .serve_connection(io, service_fn(handle_request))
                .await
            {
                eprintln!("Error serving connection: {:?}", err);
            }
        });
    }
}
