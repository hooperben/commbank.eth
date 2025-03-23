use bignum::{params::BigNumParams, RuntimeBigNum};
use noir_rsa;

fn main(x: Field, y: pub Field) {
    assert(x != y);
}

#[test]
fn test_verify_sha256_pkcs1v15_2048() {
    let hash: [u8; 32] = [
        170, 73, 202, 242, 59, 51, 217, 223, 144, 68, 128, 37, 173, 113, 111, 31, 123, 33, 159, 224,
        113, 22, 83, 209, 29, 56, 75, 3, 127, 211, 9, 97,
    ];
    let params: BigNumParams<18, 2048> = BigNumParams::new(
        false,
        [
            0x743c0f8e65e4fb6697b157b927a1d5,
            0x4e8bcdd74218318f81a0169da2f03,
            0x9d788befc24bdeca3e6eb6453d605b,
            0x534f0cf627e49924065deeec548559,
            0x42f8dc543d1f7622855f9bf2ab9b6a,
            0xb76ff1f7f0932902cda76e45969275,
            0x3d48c371f21a32523fd83b09176091,
            0x232682ec161a005bb735b143ea29f0,
            0x2d40f0b4f87ec4a4762c1a23d2b0c6,
            0x84a45617096c82eea49b6a0986ec84,
            0x61fcd61fba5ffdf18c6861e3d5b27a,
            0x9efc4c25607ea7e06540ea774908df,
            0x3338c8d4c8d0d6b46ee5ca288f65ca,
            0x5d8abcbf3a3a536d3987b1579e529f,
            0x44c740409196145c41efd1040a695b,
            0xd1ada66d4290c25653c37d29138ce2,
            0x537703edad3ef22f7c2020c36dec99,
            0xbe,
        ],
        [
            0x7dcb8c26d9b17bce7dc852deaeaba3,
            0x904cc12c15c60b3b515b09b8c0a9a1,
            0x4ed031dbb9a207f9b7f9804b492c8d,
            0x6468a781ee285c8eebf3847e5ea88,
            0x7ffcd63e53db732ac0c3f3aea57600,
            0xc12f4ce681d3cac19b4b0d811053ed,
            0xdc7cc64946715b870c2690bacf9a31,
            0x3b89d4a411cc794dcadfc909188734,
            0x158296b583c9ee09fb805ea4ce0440,
            0x17e4f1e1f52c27ca182693fc737aa7,
            0x1d33876da5efb89672f9d2ad6ff657,
            0xd88e204e87889e9434567b1140faa6,
            0xf9edf7acd340061fa2ea36b114c5cd,
            0x7f6c5ed2da40304456cf2fe12899e1,
            0xba79dd9ee9b599a61175d249a72fdd,
            0x6c6000b7d74a69c000a312dcbafb,
            0x5dfc3b45417ee9b11bdbbd25e845a1,
            0x1585,
        ],
    );
    let signature: RuntimeBigNum<18, 2048> = RuntimeBigNum {
        params,
        limbs: [
            0x9c3422291b4b798edd25bbf0653eb5,
            0xa26c836458e81bc8d3f4367cb2aa9b,
            0x8128cc2410debd78aa7489cb15d327,
            0x6bcd9f929c8122e8df7a110d9c9d24,
            0xc156ff9816bbd0ef6473e6250cbac3,
            0x8c6461200a956953dda146e7213324,
            0x6b2b7b6f4ea338ee1c5c955dbf8b5e,
            0x95cfb480efd1e638a34647b925363a,
            0x69dc0fc341f2b6db89741054479bc8,
            0x277b7b6695a655545ad8b700962bd0,
            0x9e680ed8a370c66e6cc8bca518e1e3,
            0xc576046c8b8c347e2db0fc9ad4c1ac,
            0xb28d49e4872864f1f0b92259ba2c63,
            0xdd2e08c438903f4bfc7b5f59bfe4cd,
            0x8bac5d49fc7c87df203daaa1f9d626,
            0xf7ef4367f69333c53b887a50d8b040,
            0xafe6c76c890ee369666d74b496281f,
            0x3e,
        ],
    };
    assert(noir_rsa::rsa::verify_sha256_pkcs1v15(hash, signature, 65537));
}
