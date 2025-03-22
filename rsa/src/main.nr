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

#[test]
fn test_verify_sha256_pkcs1v15_2048_84587() {
    let hash: [u8; 32] = [
        4, 37, 99, 165, 69, 68, 107, 221, 158, 31, 54, 89, 27, 19, 167, 127, 244, 37, 227, 143, 31,
        75, 30, 42, 66, 97, 110, 156, 215, 199, 123, 107,
    ];
    let params: BigNumParams<18, 2048> = BigNumParams::new(
        false,
        [
            0x4790d897c6d8f6dbdfb983072e7f2d,
            0x96be6d71599f6f5d4caa6b0beaff6a,
            0x988bf31b68b86cdac553d8674293d7,
            0xf6950cec02775db51b5c5957331b9,
            0x6e66daaf5311c9a8cdaa35ebcf5f6,
            0x774a066988012678c3f1808aa54366,
            0xa7e357c644a41eb5569ea2bd49ac98,
            0x2b3408e2c101834e7e2b71155155d0,
            0x8ed6b7b939055fef758b89769d8236,
            0xd4e29a3bf1e431625c0ecf54cc2468,
            0xfcbbf26b327a0f47a9eee5eed5e655,
            0xf92887ef769f616a6c823b9dd92625,
            0x6a2613cfcf00d003abf2c695e20d0e,
            0x35b2ff0b04b456df738d6ec213a3c4,
            0xcdc1290196c695f642725cdaf255f3,
            0xb58f8745389992674bdfdbc02472f1,
            0xa9d8c5ca3635753ee4fb02b13cda1d,
            0x9a,
        ],
        [
            0x5e99e85333267403b4c2ff4a66c254,
            0xfa44826be3b2f96e0784e19897c67a,
            0xfe97ca374fd1620bf1adf4bc23173b,
            0x37897c39bdd62dfbb0b1b8c84d96cc,
            0x782aaf45c17a8bfaf6b2a4296a316a,
            0x2420462ea12e3cc39fcde689b428c3,
            0xf7812ec60cd4dea31c1b65b2789fc7,
            0xf780c19d92f1b696d5b184e03f6195,
            0xed8fa86ec9c85295bc9d0cd36d6095,
            0xb4716e8de4ac8dcc7ba866a22af694,
            0x6da5aca505b9ca2b8fd37c5071ac9f,
            0xf81d4c75689d85772f49db5dc765d4,
            0xce851241e57c3b2834e9416150ac72,
            0xec219a0143bf458b11b292f8b750de,
            0x47cc72150dd0d9c06c6d90272c8d1,
            0xfa217fc4f2b03d3961f1c45b6061ef,
            0xba023e3e925cfab823cbd8d15003dc,
            0x1a7b,
        ],
    );
    let signature: RuntimeBigNum<18, 2048> = RuntimeBigNum {
        params,
        limbs: [
            0x06167354bb0b5f769f109e18c1c22b,
            0x263916530e33ef4978c3dbc4844a3b,
            0x45ffbfb966ebec495c58571b7ec2ec,
            0xb4001b6b30a60726bd0dd7920e653d,
            0x2e52a2040dbca9ec70452345ba569e,
            0xa56d6efbc5ef920bb8bdd814f59756,
            0x27db192d9a50dcc913607a777d4fcb,
            0x45418ccb2084376f3afd2f3d333c39,
            0xb36a46aae48f2a1af8e3a33c354538,
            0x2d4c00fb872decf6dcdd986563dd12,
            0x8857997e98702e97b8f7cbe8fd5fcc,
            0xba7950ff286c478719e444fbd75515,
            0x951939e7f283e83d343eaaa1c23f7a,
            0xd7aa887deb92f55260dcde07099070,
            0x628ada43987607ae805ff19d869b86,
            0x3ccc1ea4dcfdb0400a0a07c01c505e,
            0x8381721b8995ed88520b0ee2c104cd,
            0x45,
        ],
    };

    assert(noir_rsa::rsa::verify_sha256_pkcs1v15(hash, signature, 65537));
}
// #[test]
// fn test_verify_sha256_pkcs1v15_2048_76443() {
//     // Message: "Hello, this is a test message for Noir RSA verification"
//     let hash: [u8; 32] = [
//         163, 108, 173, 137, 171, 229, 166, 3, 19, 188, 101, 81, 122, 255, 23, 97, 37, 124, 164, 155,
//         162, 23, 220, 149, 57, 134, 81, 199, 12, 159, 53, 228,
//     ];

//     let params: BigNumParams<18, 2048> = BigNumParams::new(
//         false,
//         [
//             0x3f8cf4f05db0a72e4cfdcc6423f6c8,
//             0x7599dcc592ebfc4768d53f60baeba0,
//             0x4055f471c8af51c2a301d7bb947ad3,
//             0xe4ae94f3941ebe752485a88db7e79a,
//             0x0407a023670fc6d47e56eef76ed017,
//             0x370f9389c29a9e8c99013bef3c62fe,
//             0x79ab5a1711ee7f0f51534e11580150,
//             0x69d27ad0b3045e887318846dbe2759,
//             0xbd37070f825f34ab15e3e07a4f3c73,
//             0x1710466f5e37d16ca88de5fc432603,
//             0xa627d9512005df9d60bdedf94e1068,
//             0x94a1d55916011511c56fb9ae2bc08c,
//             0xe76abe67e6c1bebc6c49a41d55e5bb,
//             0x5969e262039f990c7fc143c7c5c051,
//             0xe7688bf3953338a5c93d6d29b6236e,
//             0x3b64a7f1670e62523c7473abdce3a1,
//             0x73805bd09769049dbe92aad492e9df,
//             0xc6,
//         ],
//         [
//             0x013f8cf4f05db0a72e4cfdcc6423f6,
//             0xc87599dcc592ebfc4768d53f60baeb,
//             0xa04055f471c8af51c2a301d7bb947a,
//             0xd3e4ae94f3941ebe752485a88db7e7,
//             0x9a0407a023670fc6d47e56eef76ed0,
//             0x17370f9389c29a9e8c99013bef3c62,
//             0xfe79ab5a1711ee7f0f51534e115801,
//             0x5069d27ad0b3045e887318846dbe27,
//             0x59bd37070f825f34ab15e3e07a4f3c,
//             0x731710466f5e37d16ca88de5fc4326,
//             0x03a627d9512005df9d60bdedf94e10,
//             0x6894a1d55916011511c56fb9ae2bc0,
//             0x8ce76abe67e6c1bebc6c49a41d55e5,
//             0xbb5969e262039f990c7fc143c7c5c0,
//             0x51e7688bf3953338a5c93d6d29b623,
//             0x6e3b64a7f1670e62523c7473abdce3,
//             0xa173805bd09769049dbe92aad492e9,
//             0xdfc6,
//         ],
//     );

//     let signature: RuntimeBigNum<18, 2048> = RuntimeBigNum {
//         params,
//         limbs: [
//             0xe558c728c9d2006b07ec14cf9bb8e1,
//             0x4dac0e5061839fa97750c1f2f83036,
//             0x247c894ce9a5239372315565dd390a,
//             0xa531e86617ef33d551e5afb8921634,
//             0x5864085418585151a348bdf3cf2ba3,
//             0xd6b08fbaf651e05a292c21fd8affac,
//             0x65b33fee0327d3383a848d43369050,
//             0xed5f57fab8a36745607bf167a0d683,
//             0x3c41b79602a60d5512726cc51ca5ea,
//             0x6684471431640d94626808423ef1cd,
//             0x5da643c093da5d8b22f12add947fd7,
//             0xf6a9592509154f00ab7ae0a67568f4,
//             0xb348d9fc238ac5598f5f2d320443c5,
//             0xdc53de010a402d22fc47fd8e7bf4ff,
//             0x23e5932beee674a236df020ba50e50,
//             0x561a9eaab9d78aedce6e2b08c418e3,
//             0x8953fc0d317b12557ff037b710e735,
//             0xa0,
//         ],
//     };

//     assert(noir_rsa::rsa::verify_sha256_pkcs1v15(hash, signature, 65537));
// }

// #[test]
// fn test_verify_sha256_pkcs1v15_1024_76469() {
//     // Message: "Hello, this is a test message for Noir RSA verification"
//     let hash: [u8; 32] = [
//         163, 108, 173, 137, 171, 229, 166, 3, 19, 188, 101, 81, 122, 255, 23, 97, 37, 124, 164, 155,
//         162, 23, 220, 149, 57, 134, 81, 199, 12, 159, 53, 228,
//     ];

//     let params: BigNumParams<12, 1024> = BigNumParams::new(
//         false,
//         [
//             0x6b0c3689eda427b9c79485,
//             0x9a687c34447eeaab85d5ee,
//             0x36aaa059552cf6319f26ad,
//             0xfaded4ab0287fc89df2e26,
//             0xd5c3231fa62a6120fbff4e,
//             0x6f300a78d035c75cfe9405,
//             0x3fd21e42c29157402651ae,
//             0x5f5427788c4b06ffc0e7ae,
//             0xc8a1a12967f84539c60d8c,
//             0x864a0e248770df71a523a8,
//             0x4edbdbf3be5b23f5f80543,
//             0x0ffa14a2b7bbfb,
//         ],
//         [
//             0x016b0c3689eda427b9c794,
//             0x859a687c34447eeaab85d5,
//             0xee36aaa059552cf6319f26,
//             0xadfaded4ab0287fc89df2e,
//             0x26d5c3231fa62a6120fbff,
//             0x4e6f300a78d035c75cfe94,
//             0x053fd21e42c29157402651,
//             0xae5f5427788c4b06ffc0e7,
//             0xaec8a1a12967f84539c60d,
//             0x8c864a0e248770df71a523,
//             0xa84edbdbf3be5b23f5f805,
//             0x430ffa14a2b7bbfb,
//         ],
//     );

//     let signature: RuntimeBigNum<12, 1024> = RuntimeBigNum {
//         params,
//         limbs: [
//             0xafc24f203ebd4fc8494bac,
//             0x8af3dc14bdfd8b65bbf52b,
//             0x92f057fe25bb58b0ce4bc2,
//             0x4417d680c3430353a32237,
//             0x1124076fb186a5681fa9e6,
//             0xea20bb9b2b7a14621e8fdb,
//             0xed74e77d7bf6e8b24d1e43,
//             0x8830a7e8636c2770171095,
//             0x57c79ba433a7e5ade0c05c,
//             0xd71674b7081aa4a7cddf91,
//             0x23944ccf53ab1530704ac5,
//             0x6cfc73bd5f17a9,
//         ],
//     };

//     assert(noir_rsa::rsa::verify_sha256_pkcs1v15(hash, signature, 65537));
// }
