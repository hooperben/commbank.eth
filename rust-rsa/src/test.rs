#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_key_pair_and_sign() {
        // Create a key pair
        let key_pair = create_key_pair("test secret", 1024, 65537).unwrap();

        // Verify we can access the keys
        assert!(!key_pair.private_key().is_empty());
        assert!(!key_pair.public_key().is_empty());

        // Sign a message using the generated private key
        let message = "Hello, world!";
        let signature_result =
            generate_signature_from_key(message, &key_pair.private_key()).unwrap();

        // Verify the signature result contains expected data
        assert!(!signature_result.hash().is_empty());
        assert!(!signature_result.modulus_limbs().is_empty());
        assert!(!signature_result.redc_limbs().is_empty());
        assert!(!signature_result.signature_limbs().is_empty());

        // Create a second signature with the same key and message - should be identical
        let signature_result2 =
            generate_signature_from_key(message, &key_pair.private_key()).unwrap();
        assert_eq!(
            signature_result.signature_limbs(),
            signature_result2.signature_limbs()
        );

        // Different message should produce different signature
        let message2 = "Different message";
        let signature_result3 =
            generate_signature_from_key(message2, &key_pair.private_key()).unwrap();
        assert_ne!(
            signature_result.signature_limbs(),
            signature_result3.signature_limbs()
        );

        // Different secret should produce different key pair
        let key_pair2 = create_key_pair("different secret", 1024, 65537).unwrap();
        assert_ne!(key_pair.private_key(), key_pair2.private_key());
        assert_ne!(key_pair.public_key(), key_pair2.public_key());

        // Same secret should produce identical key pair
        let key_pair3 = create_key_pair("test secret", 1024, 65537).unwrap();
        assert_eq!(key_pair.private_key(), key_pair3.private_key());
        assert_eq!(key_pair.public_key(), key_pair3.public_key());
    }
}
