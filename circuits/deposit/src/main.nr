pub fn calculate_leaf(address: [u8; 32], amount: [u8; 32], asset_id: [u8; 20]) -> [u8; 32] {
    // need to combine into one giga array
    let mut concat_values = [0; 84];

    for i in 0..32 {
        concat_values[i] = address[i];
    }
    for i in 0..32 {
        concat_values[i + 32] = amount[i];
    }
    for i in 0..20 {
        concat_values[i + 32 + 32] = asset_id[i];
    }

    let current = std::hash::keccak256(concat_values, 84);

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
    pub_key: pub [u8; 32],
    asset_id: pub [u8; 20],
) {
    // reconstruct the hash
    let note_leaf = calculate_leaf(pub_key, amount_array, asset_id);
    // check hash matches
    assert(note_leaf == hash, "Invalid Deposit Hash");

    // we need to reconstruct the amount array to ensure it matches the amount
    let reconstructed: u32 = u8_array_to_u32::<32>(amount_array);
    assert(reconstructed == amount, "Invalid deposit amount")

}

#[test]
fn test_main() {
    let alice_pub_key = [
        151, 116, 112, 201, 177, 178, 220, 130, 139, 247, 208, 145, 252, 98, 247, 74, 187, 155, 80,
        203, 139, 22, 146, 10, 194, 211, 107, 70, 193, 139, 54, 145,
    ];
    let amount = 69420;
    let amount_array: [u8; 32] = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        15, 44,
    ];
    let asset_id = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    let note_hash = [
        17, 166, 200, 208, 50, 80, 212, 89, 34, 241, 199, 98, 171, 160, 70, 172, 15, 29, 97, 214,
        80, 34, 249, 94, 114, 201, 202, 146, 52, 67, 64, 126,
    ];

    main(note_hash, amount, amount_array, alice_pub_key, asset_id);
}
