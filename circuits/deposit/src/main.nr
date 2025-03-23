// was 32, now 294
// 32 + 32 + 20 = 84
// 294 + 32 + 20 = 346
pub fn calculate_leaf(address: [u8; 294], amount: [u8; 32], asset_id: [u8; 20]) -> [u8; 32] {
    // need to combine into one giga array

    let mut concat_values = [0; 346];

    for i in 0..294 {
        concat_values[i] = address[i];
    }
    for i in 0..32 {
        concat_values[i + 294] = amount[i];
    }
    for i in 0..20 {
        concat_values[i + 294 + 32] = asset_id[i];
    }

    let current = std::hash::keccak256(concat_values, 346);

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
    pub_key: [u8; 294],
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
        48, 130, 1, 34, 48, 13, 6, 9, 42, 134, 72, 134, 247, 13, 1, 1, 1, 5, 0, 3, 130, 1, 15, 0,
        48, 130, 1, 10, 2, 130, 1, 1, 0, 188, 245, 111, 213, 47, 196, 110, 189, 254, 239, 107, 181,
        181, 239, 24, 150, 95, 236, 182, 186, 108, 245, 82, 17, 241, 221, 124, 61, 168, 66, 61, 92,
        198, 164, 107, 16, 199, 158, 71, 65, 36, 45, 165, 1, 206, 218, 99, 45, 111, 86, 198, 190,
        129, 178, 124, 164, 223, 126, 180, 93, 14, 6, 5, 69, 220, 147, 77, 197, 45, 100, 229, 249,
        190, 247, 123, 217, 34, 114, 181, 105, 85, 218, 134, 51, 234, 122, 54, 171, 61, 101, 124,
        93, 65, 2, 226, 168, 98, 157, 141, 81, 46, 136, 111, 106, 222, 78, 14, 167, 82, 67, 39, 29,
        158, 248, 92, 171, 66, 206, 5, 27, 77, 12, 203, 187, 215, 62, 137, 112, 196, 117, 67, 33,
        220, 105, 91, 68, 169, 214, 221, 148, 128, 229, 7, 250, 154, 227, 90, 145, 200, 1, 54, 19,
        237, 106, 144, 101, 98, 162, 208, 217, 137, 75, 177, 109, 39, 81, 43, 145, 113, 59, 199, 52,
        232, 121, 244, 240, 102, 211, 161, 113, 200, 37, 119, 132, 90, 198, 236, 119, 161, 95, 89,
        110, 20, 100, 183, 47, 189, 200, 147, 38, 43, 76, 191, 201, 228, 77, 23, 0, 213, 23, 103,
        62, 112, 204, 250, 13, 65, 46, 60, 229, 35, 4, 65, 3, 168, 62, 208, 32, 7, 22, 235, 38, 80,
        220, 79, 235, 235, 111, 5, 54, 12, 178, 58, 20, 116, 122, 206, 31, 177, 252, 134, 48, 191,
        92, 179, 155, 2, 3, 1, 0, 1,
    ];
    let amount = 69420;
    let amount_array: [u8; 32] = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        15, 44,
    ];
    let asset_id =
        [220, 100, 161, 64, 170, 62, 152, 17, 0, 169, 190, 202, 78, 104, 95, 150, 47, 12, 246, 201];

    let note_hash = [
        216, 8, 47, 18, 3, 94, 168, 189, 18, 20, 61, 0, 215, 60, 86, 23, 128, 251, 101, 124, 49,
        225, 196, 104, 172, 30, 145, 230, 174, 137, 52, 254,
    ];

    main(note_hash, amount, amount_array, asset_id, alice_pub_key);
}
