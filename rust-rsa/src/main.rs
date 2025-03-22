use num_bigint::BigUint;
use rsa::pkcs1v15::Signature;
use rsa::{RsaPrivateKey, RsaPublicKey};
use toml::Value;

use rsa::signature::{SignatureEncoding, Signer};
use rsa::traits::PublicKeyParts;
use sha2::{Digest, Sha256};

// Only include clap when the cli feature is enabled
#[cfg(feature = "cli")]
use clap::{App, Arg};

use noir_bignum_paramgen::{
    bn_limbs, compute_barrett_reduction_parameter, split_into_120_bit_limbs,
};

use signature_gen::{create_key_pair, generate_signature, generate_signature_from_key};

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

fn generate_2048_bit_signature_parameters(msg: &str, as_toml: bool, exponent: u32) {
    // ... keep existing code ...
}

fn generate_1024_bit_signature_parameters(msg: &str, as_toml: bool, exponent: u32) {
    // ... keep existing code ...
}

// Wrap EVERYTHING related to clap in the cli feature
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
            Arg::with_name("secret")
                .short("s")
                .long("secret")
                .takes_value(true)
                .help("Secret to derive the key pair from"),
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

    // If a secret is provided, use that to create a key pair and sign
    if let Some(secret) = matches.value_of("secret") {
        let key_pair = create_key_pair(secret, b, e).unwrap();
        println!("Generated key pair from secret");

        let result = generate_signature_from_key(msg, &key_pair.private_key()).unwrap();
        // Display results similar to the original code
        // ...
    } else {
        // Use the original implementation for backward compatibility
        if b == 1024 {
            generate_1024_bit_signature_parameters(msg, as_toml, e);
        } else {
            generate_2048_bit_signature_parameters(msg, as_toml, e);
        }
    }
}

// Add a stub main for when cli feature is disabled
#[cfg(not(feature = "cli"))]
fn main() {
    // Empty main function - we're compiling a library for WASM
}

#[cfg(test)]
mod tests {
    // ... keep existing code ...
}
