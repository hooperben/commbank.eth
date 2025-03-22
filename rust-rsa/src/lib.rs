use noir_bignum_paramgen::{compute_barrett_reduction_parameter, split_into_120_bit_limbs};
use num_bigint::BigUint;
use rand::{rngs::StdRng, SeedableRng};
use rsa::pkcs1v15::Signature;
use rsa::signature::{SignatureEncoding, Signer};
use rsa::traits::PublicKeyParts;
use rsa::{RsaPrivateKey, RsaPublicKey};
use sha2::{Digest, Sha256};
use toml::Value;
use wasm_bindgen::prelude::*;

// Only include clap when the cli feature is enabled
#[cfg(feature = "cli")]
use clap::{App, Arg};

#[wasm_bindgen]
pub struct SignatureResult {
    // Fields are private, we'll use getters to access them
    hash: String,
    modulus_limbs: String,
    redc_limbs: String,
    signature_limbs: String,
}

#[wasm_bindgen]
impl SignatureResult {
    // Add getter methods for each field
    #[wasm_bindgen(getter)]
    pub fn hash(&self) -> String {
        self.hash.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn modulus_limbs(&self) -> String {
        self.modulus_limbs.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn redc_limbs(&self) -> String {
        self.redc_limbs.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn signature_limbs(&self) -> String {
        self.signature_limbs.clone()
    }
}

#[wasm_bindgen]
pub struct KeyPair {
    private_key: Vec<u8>,
    public_key: Vec<u8>,
}

#[wasm_bindgen]
impl KeyPair {
    #[wasm_bindgen(getter)]
    pub fn private_key(&self) -> Vec<u8> {
        self.private_key.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn public_key(&self) -> Vec<u8> {
        self.public_key.clone()
    }
}

#[wasm_bindgen]
pub fn create_key_pair(secret: &str, bits: u32, exponent: u32) -> Result<KeyPair, JsError> {
    if bits != 1024 && bits != 2048 {
        return Err(JsError::new("Bits must be either 1024 or 2048"));
    }

    // Create a deterministic RNG from the secret
    let mut hasher = Sha256::new();
    hasher.update(secret.as_bytes());
    let hash_result = hasher.finalize();
    let mut seed = [0u8; 32];
    seed.copy_from_slice(&hash_result);
    let mut rng = StdRng::from_seed(seed);

    // Generate the key pair
    let bits_usize = bits as usize;
    let priv_key = RsaPrivateKey::new_with_exp(&mut rng, bits_usize, &BigUint::from(exponent))
        .map_err(|e| JsError::new(&format!("Failed to generate key: {}", e)))?;

    let pub_key: RsaPublicKey = (&priv_key).into();

    // Serialize the keys - fixed to handle SecretDocument correctly
    let private_key = rsa::pkcs8::EncodePrivateKey::to_pkcs8_der(&priv_key)
        .map_err(|e| JsError::new(&format!("Failed to serialize private key: {}", e)))?
        .as_bytes()
        .to_vec();

    let public_key = rsa::pkcs8::EncodePublicKey::to_public_key_der(&pub_key)
        .map_err(|e| JsError::new(&format!("Failed to serialize public key: {}", e)))?
        .as_bytes()
        .to_vec();

    Ok(KeyPair {
        private_key,
        public_key,
    })
}

#[wasm_bindgen]
pub fn generate_signature_from_key(
    msg: &str,
    private_key: &[u8],
) -> Result<SignatureResult, JsError> {
    let mut hasher = Sha256::new();
    hasher.update(msg.as_bytes());
    let hashed_message = hasher.finalize();

    let hashed_as_bytes = hashed_message
        .iter()
        .map(|&b| b.to_string())
        .collect::<Vec<String>>()
        .join(", ");

    // Parse the private key with explicit type annotation
    let priv_key: RsaPrivateKey = rsa::pkcs8::DecodePrivateKey::from_pkcs8_der(private_key)
        .map_err(|e| JsError::new(&format!("Failed to parse private key: {}", e)))?;

    let pub_key: RsaPublicKey = (&priv_key).into();

    let signing_key = rsa::pkcs1v15::SigningKey::<Sha256>::new(priv_key);
    let sig: Vec<u8> = signing_key.sign(msg.as_bytes()).to_vec();

    let sig_bytes = &Signature::try_from(sig.as_slice())
        .map_err(|e| JsError::new(&format!("Failed to create signature: {}", e)))?
        .to_bytes();

    let sig_uint: BigUint = BigUint::from_bytes_be(sig_bytes);

    let bits_usize = match pub_key.n().bits() {
        bits if bits <= 1024 => 1024,
        _ => 2048,
    };

    let modulus_limbs: Vec<BigUint> = split_into_120_bit_limbs(&pub_key.n().clone(), bits_usize);
    let redc_limbs = split_into_120_bit_limbs(
        &compute_barrett_reduction_parameter(&pub_key.n().clone()),
        bits_usize,
    );
    let sig_limbs = split_into_120_bit_limbs(&sig_uint.clone(), bits_usize);

    let modulus_str = format_limbs_as_hex(&modulus_limbs);
    let redc_str = format_limbs_as_hex(&redc_limbs);
    let sig_str = format_limbs_as_hex(&sig_limbs);

    Ok(SignatureResult {
        hash: hashed_as_bytes,
        modulus_limbs: modulus_str,
        redc_limbs: redc_str,
        signature_limbs: sig_str,
    })
}

#[wasm_bindgen]
pub fn generate_signature(msg: &str, bits: u32, exponent: u32) -> Result<SignatureResult, JsError> {
    if bits != 1024 && bits != 2048 {
        return Err(JsError::new("Bits must be either 1024 or 2048"));
    }

    let mut hasher = Sha256::new();
    hasher.update(msg.as_bytes());
    let hashed_message = hasher.finalize();

    let hashed_as_bytes = hashed_message
        .iter()
        .map(|&b| b.to_string())
        .collect::<Vec<String>>()
        .join(", ");

    let mut rng = rand::thread_rng();
    let bits_usize = bits as usize;
    let priv_key = RsaPrivateKey::new_with_exp(&mut rng, bits_usize, &BigUint::from(exponent))
        .map_err(|e| JsError::new(&format!("Failed to generate key: {}", e)))?;
    let pub_key: RsaPublicKey = priv_key.clone().into();

    let signing_key = rsa::pkcs1v15::SigningKey::<Sha256>::new(priv_key);
    let sig: Vec<u8> = signing_key.sign(msg.as_bytes()).to_vec();

    let sig_bytes = &Signature::try_from(sig.as_slice())
        .map_err(|e| JsError::new(&format!("Failed to create signature: {}", e)))?
        .to_bytes();

    let sig_uint: BigUint = BigUint::from_bytes_be(sig_bytes);

    let modulus_limbs: Vec<BigUint> = split_into_120_bit_limbs(&pub_key.n().clone(), bits_usize);
    let redc_limbs = split_into_120_bit_limbs(
        &compute_barrett_reduction_parameter(&pub_key.n().clone()),
        bits_usize,
    );
    let sig_limbs = split_into_120_bit_limbs(&sig_uint.clone(), bits_usize);

    let modulus_str = format_limbs_as_hex(&modulus_limbs);
    let redc_str = format_limbs_as_hex(&redc_limbs);
    let sig_str = format_limbs_as_hex(&sig_limbs);

    Ok(SignatureResult {
        hash: hashed_as_bytes,
        modulus_limbs: modulus_str,
        redc_limbs: redc_str,
        signature_limbs: sig_str,
    })
}

fn format_limbs_as_hex(limbs: &Vec<BigUint>) -> String {
    limbs
        .iter()
        .map(|a| format!("0x{:x}", a))
        .collect::<Vec<_>>()
        .join(", ")
}

fn format_limbs_as_toml_value(limbs: &Vec<BigUint>) -> Vec<Value> {
    limbs
        .iter()
        .map(|a| Value::String(format!("0x{:x}", a)))
        .collect()
}

// Wrap the main function so it's only compiled with the cli feature
#[cfg(feature = "cli")]
fn main() {
    let matches = App::new("RSA Signature Generator")
        .arg(
            Arg::with_name("msg")
                .short("m")
                .long("msg")
                .takes_value(true)
                .help("Message to sign")
                .required(true),
        )
        .arg(
            Arg::with_name("toml")
                .short("t")
                .long("toml")
                .help("Print output in TOML format"),
        )
        .arg(
            Arg::with_name("exponent")
                .short("e")
                .long("exponent")
                .takes_value(true)
                .help("Exponent to use for the key")
                .default_value("65537"),
        )
        .arg(
            Arg::with_name("bits")
                .short("b")
                .long("bits")
                .takes_value(true)
                .help("Number of bits of RSA signature (1024 or 2048")
                .default_value("2048"),
        )
        .get_matches();

    let msg = matches.value_of("msg").unwrap();
    let as_toml = matches.is_present("toml");
    let e: u32 = matches.value_of("exponent").unwrap().parse().unwrap();
    let b: u32 = matches.value_of("bits").unwrap().parse().unwrap();
    assert!(
        b == 1024 || b == 2048,
        "Number of bits of RSA signature can only be 1024 or 2048"
    );
    if b == 1024 {
        generate_1024_bit_signature_parameters(msg, as_toml, e);
    } else {
        generate_2048_bit_signature_parameters(msg, as_toml, e);
    }
}

// Add a stub main for when cli feature is disabled
#[cfg(not(feature = "cli"))]
fn main() {
    // Empty main function - we're compiling a library for WASM
}

// Adding these missing functions
fn generate_1024_bit_signature_parameters(msg: &str, as_toml: bool, e: u32) {
    // For now, just call the existing generate_signature function
    match generate_signature(msg, 1024, e) {
        Ok(result) => {
            if as_toml {
                println!("hash = [{}]", result.hash);
                println!("modulus = [{}]", result.modulus_limbs);
                println!("redc = [{}]", result.redc_limbs);
                println!("signature = [{}]", result.signature_limbs);
            } else {
                println!("Hash: {}", result.hash);
                println!("Modulus: {}", result.modulus_limbs);
                println!("REDC parameter: {}", result.redc_limbs);
                println!("Signature: {}", result.signature_limbs);
            }
        }
        Err(e) => eprintln!("Error: {:?}", e),
    }
}

fn generate_2048_bit_signature_parameters(msg: &str, as_toml: bool, e: u32) {
    // For now, just call the existing generate_signature function
    match generate_signature(msg, 2048, e) {
        Ok(result) => {
            if as_toml {
                println!("hash = [{}]", result.hash);
                println!("modulus = [{}]", result.modulus_limbs);
                println!("redc = [{}]", result.redc_limbs);
                println!("signature = [{}]", result.signature_limbs);
            } else {
                println!("Hash: {}", result.hash);
                println!("Modulus: {}", result.modulus_limbs);
                println!("REDC parameter: {}", result.redc_limbs);
                println!("Signature: {}", result.signature_limbs);
            }
        }
        Err(e) => eprintln!("Error: {:?}", e),
    }
}
