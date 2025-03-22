use bignum::{params::BigNumParams, RuntimeBigNum};
use noir_rsa;

fn compare_signature_sha256<let N: u32>(padded_sha256_hash: [u8; N], msg_hash: [u8; 32]) -> bool {
    // Get length of sig (e.g. 1048 = 128 bytes, 2048 = 256 bytes)
    // NOTE: Assume MAX_BYTES < 2^32 bit number. MAX_BYTES of 259 > 2^8 bits so need to cast it to u32
    for i in 0..32 {
        // Padded hash is reversed
        assert(padded_sha256_hash[31 - i] == msg_hash[i]);
    }

    let hash_prefix: [u8; 19] =
        [32, 4, 0, 5, 1, 2, 4, 3, 101, 1, 72, 134, 96, 9, 6, 13, 48, 49, 48];

    for i in 32..51 {
        assert(hash_prefix[i - 32] == padded_sha256_hash[i]);
    }

    assert(padded_sha256_hash[51] == 0);

    // Sub 32 bytes for hash, 19 bytes for prefix, 1 byte for 0, 1 byte for 1, 1 byte for 0
    let ps_len = N - 54;
    for i in 52..N {
        if i < 52 + ps_len {
            // PS padding which depends on RSA modulus / sig length. 1024 bits = 128 bytes = 128 - 54 = 74 bytes of 0xFF padding
            assert(padded_sha256_hash[i] == 255);
        } else if i == 52 + ps_len {
            // Pad 0x01
            assert(padded_sha256_hash[i] == 1);
        } else if i == 53 + ps_len {
            // 0x00
            assert(padded_sha256_hash[i] == 0);
        } else {
            // Padded with 0 until MAX_BYTES
            assert(padded_sha256_hash[i] == 0);
        }
    }

    true
}

pub fn verify_sha256_pkcs1v15<let NumLimbs: u32, let ModBits: u32>(
    msg_hash: [u8; 32],
    sig: RuntimeBigNum<NumLimbs, ModBits>,
    exponent: u32,
) -> bool {
    assert((exponent == 3) | (exponent == 65537), "Exponent must be 65537 or 3");
    let mut exponentiated = sig * sig; // sig^2
    if exponent == 65537 {
        // e = 65537 = 1 0000 0000 0000 0001
        exponentiated = exponentiated * exponentiated; // sig^4
        exponentiated = exponentiated * exponentiated; // sig^8
        exponentiated = exponentiated * exponentiated; // sig^16
        exponentiated = exponentiated * exponentiated; // sig^32
        exponentiated = exponentiated * exponentiated; // sig^64
        exponentiated = exponentiated * exponentiated; // sig^128
        exponentiated = exponentiated * exponentiated; // sig^256
        exponentiated = exponentiated * exponentiated; // sig^512
        exponentiated = exponentiated * exponentiated; // sig^1024
        exponentiated = exponentiated * exponentiated; // sig^2048
        exponentiated = exponentiated * exponentiated; // sig^4096
        exponentiated = exponentiated * exponentiated; // sig^8192
        exponentiated = exponentiated * exponentiated; // sig^16384
        exponentiated = exponentiated * exponentiated; // sig^32768
        exponentiated = exponentiated * exponentiated; // sig^65536
    }
    // otherwise, e = 3 = 11
    exponentiated = exponentiated * sig; // either sig^2 * sig = sig^3 or sig^65536 * sig = sig^65537
    let mut padded_sha256_hash_bytes: [u8; (ModBits + 7) / 8] = exponentiated.to_le_bytes();
    compare_signature_sha256(padded_sha256_hash_bytes, msg_hash)
}

fn main(x: Field, y: pub Field) {
    assert(x != y);
}

#[test]
fn test_verify_sha256_pkcs1v15_2048() {
    // Output of `cargo run -- --msg "Hello World! This is Noir-RSA"` in the `signature_gen` directory
    let sha256_hash: [u8; 32] = [
        91, 207, 46, 60, 22, 153, 217, 144, 2, 127, 224, 143, 181, 45, 32, 120, 122, 131, 166,
        79, 166, 183, 43, 158, 116, 105, 73, 207, 196, 77, 33, 5,
    ];

    let params: BigNumParams<18, 2048> = BigNumParams::new(
        false,
        [
            0x8d5e7d9daedd6cfd1c9bdf0227e05b,
            0xbfb937fc4d3cf02cc0af780f3cab44,
            0xd20637ef7adcf5d238ee87bccc9bca,
            0xb9db4f2663108e2f8b673f7612ae8b,
            0x85f894ef669b36bfd3d86b0a28873,
            0xdcc70e1884e38b8229cce3b884121d,
            0x35488d1138e0b03e1676f7f5d8a5b3,
            0xe1a97820e7dcbb4eab35c9b71bb273,
            0x97d19eb3c63249ddbfcff915863f54,
            0x3a78c7af6da0f6af0d67b1ca4b6065,
            0xd7a3c433c020f624821e5e678c7d69,
            0x52d5b53240feae82ffea3d2a3d9b09,
            0xb8aad5e19e2163f68997c6fdd71906,
            0x5db432d06e8b0bf59511100c7894e2,
            0xadc0bbc4c54da10d1cc88438ea3127,
            0xece1cf6a1501109cd2734d5893c8d9,
            0x7196b90acdf06c31b1288064fd0c27,
            0xc8,
        ],
        [
            0x1b1deccf4dbde852c34a5d6908a0f,
            0xbc9e5bdab22f023fbcca58692bccf5,
            0x1f65439685623e45396ff55751c3bf,
            0x2b6ad2c5f8e3aac15d0ccbab816bfa,
            0x5ca2e8e3048243c16c708a8030ab0d,
            0x30079bfeb1fa51e5501581173ca19c,
            0xff8d5f6bea485fdcc2716327f69ab4,
            0x36b599d81589416b5b5f037986b999,
            0x75612e34a4ff29f0a19a7823512f58,
            0x288b6897929b54c3b26a5faa07c00f,
            0x4b5675fa13ab7444f1f047d3eb1bbe,
            0x6ba0ac610ef9f267ab30fe25bb1c84,
            0xa386b48ee03168d5cea3ecb9dc901f,
            0xacf1a01f7dba44e050c976142fb1f6,
            0x97a63b5cb7efc60d3502946aec63cf,
            0x12cc1d5cab10a1e9e2398d29b9e3ef,
            0x4635cf25c66e76bba8034df46204fb,
            0x146f,
        ],
    );

    let signature: RuntimeBigNum<18, 2048> = RuntimeBigNum {
        params,
        limbs: [
            0xad29e07d16a278de49a371b9760a27,
            0x86311920cc0e17a3c20cdff4c56dbb,
            0x863556c6c5247dd83668dd825716ae,
            0xc247c960945f4485b46c33b87425ca,
            0x7326463c5c4cd5b08e21b938d9ed9a,
            0x4f89fe0c82da08a0259eddb34d0da1,
            0x43a74e76d4e1bd2666f1591889af0d,
            0x240f7b80f0ff29f4253ee3019f832d,
            0xc6edd131fbaaf725fd423dac52b362,
            0x85f9732679242163e8afff44f6104d,
            0xd3c3bbcb1757013fd6fb80f31dd9a6,
            0x9008633f15df440e6df6d21ee585a2,
            0x324df3425ed256e283be5b6b761741,
            0xc60c1302929bd0e07caa4aeff4e8fd,
            0x600d804ff13ba8d0e1bc9508714212,
            0x50f7e75e5751d7edd61167027926be,
            0x0db41d39442023e1420a8a84fe81d9,
            0xab,
        ],
    };
    assert(verify_sha256_pkcs1v15(sha256_hash, signature, 65537));
}

