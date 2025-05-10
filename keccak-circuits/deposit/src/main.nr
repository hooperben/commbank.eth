pub fn calculate_leaf(
    address: [u8; 32],
    amount: [u8; 32],
    asset_id: [u8; 20],
    note_secret: [u8; 32],
) -> [u8; 32] {
    // need to combine into one giga array
    let mut concat_values = [0; 116];

    for i in 0..32 {
        concat_values[i] = address[i];
    }
    for i in 0..32 {
        concat_values[i + 32] = amount[i];
    }
    for i in 0..20 {
        concat_values[i + 32 + 32] = asset_id[i];
    }
    for i in 0..32 {
        concat_values[i + 32 + 32 + 20] = note_secret[i];
    }

    let current = std::hash::keccak256(concat_values, 116);

    current
}

fn u8_array_to_u32<let N: u32>(array: [u8; N]) -> u32 {
    let mut value: u32 = 0;
    let start = N - 4; // Start from the last 4 bytes of the array
    for i in 0..4 {
        // Process bytes in big-endian order (most significant byte first)
        value = (value << 8) | (array[start + i] as u32);
    }
    value
}

// for deposit all of these can be public?
fn main(
    hash: pub [u8; 32],
    amount: pub u32,
    amount_array: pub [u8; 32],
    asset_id: pub [u8; 20],
    note_secret: [u8; 32],
    pub_key: [u8; 32],
) {
    // reconstruct the hash
    let note_leaf = calculate_leaf(pub_key, amount_array, asset_id, note_secret);

    // check hash matches
    assert(note_leaf == hash, "Invalid Deposit Hash");

    // we need to reconstruct the amount array to ensure it matches the amount
    let reconstructed: u32 = u8_array_to_u32::<32>(amount_array);
    assert(reconstructed == amount, "Invalid deposit amount")
}

#[test]
fn test_main() {
    let amount = 69420;
    let amount_array: [u8; 32] = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        15, 44,
    ];
    let asset_id =
        [220, 100, 161, 64, 170, 62, 152, 17, 0, 169, 190, 202, 78, 104, 95, 150, 47, 12, 246, 201];

    let note_hash = [
        135, 207, 3, 252, 203, 166, 25, 252, 103, 180, 235, 212, 43, 193, 128, 121, 171, 27, 9, 125,
        74, 40, 223, 168, 162, 126, 253, 85, 126, 38, 194, 248,
    ];
    let note_secret = [
        12, 179, 88, 236, 185, 5, 1, 40, 162, 250, 244, 199, 67, 17, 110, 236, 67, 233, 69, 234, 45,
        10, 56, 232, 198, 172, 202, 113, 124, 93, 115, 242,
    ];

    let alice_pub_key = [
        194, 196, 146, 85, 244, 123, 69, 86, 102, 102, 254, 117, 36, 34, 201, 168, 162, 139, 214,
        102, 58, 110, 211, 180, 1, 212, 112, 112, 43, 101, 72, 109,
    ];

    main(
        note_hash,
        amount,
        amount_array,
        asset_id,
        note_secret,
        alice_pub_key,
    );
}
