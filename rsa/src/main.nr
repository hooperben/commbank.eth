use bignum::{params::BigNumParams, RuntimeBigNum};
use noir_rsa;

fn main(x: Field, y: pub Field) {
    assert(x != y);
}

#[test]
fn test_verify_sha256_pkcs1v15_2048() {
    // copied from noir_rsa test repo
    let hash: [u8; 32] = [
        91, 207, 46, 60, 22, 153, 217, 144, 2, 127, 224, 143, 181, 45, 32, 120, 122, 131, 166, 79,
        166, 183, 43, 158, 116, 105, 73, 207, 196, 77, 33, 5,
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

    assert(noir_rsa::rsa::verify_sha256_pkcs1v15(hash, signature, 65537));
}
