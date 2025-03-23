use std::{collections::map::HashMap, hash::{BuildHasherDefault, poseidon2::Poseidon2Hasher}};

pub fn calculate_nullifier(
    leaf_index: [u8; 32],
    secret: [u8; 32],
    amount_array: [u8; 32],
    asset_id: [u8; 20],
) -> [u8; 32] {
    let mut concat_values = [0; 116];
    for i in 0..32 {
        concat_values[i] = leaf_index[i];
    }
    for i in 0..32 {
        concat_values[i + 32] = secret[i];
    }
    for i in 0..32 {
        concat_values[i + 32 + 32] = amount_array[i];
    }
    for i in 0..20 {
        concat_values[i + 32 + 32 + 32] = asset_id[i];
    }

    std::hash::keccak256(concat_values, 116)
}

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

pub fn concatenate_bytes32_arrays(left: [u8; 32], right: [u8; 32]) -> [u8; 32 + 32] {
    let mut result = [0; 32 + 32];
    for i in 0..32 {
        result[i] = left[i];
    }
    for i in 0..32 {
        result[i + 32] = right[i];
    }
    result
}

pub fn compute_keccak_merkle_hash(
    leaf: [u8; 32],
    path: [Field; 20],
    path_data: [[u8; 32]; 20],
) -> [u8; 32] {
    let mut current = leaf;
    for i in 0..20 {
        let path_bit = path[i];
        let (hash_left, hash_right) = if path_bit == 0 {
            (path_data[i], current)
        } else {
            (current, path_data[i])
        };
        let concat = concatenate_bytes32_arrays(hash_left, hash_right);
        current = std::hash::keccak256(concat, 32 + 32);
    }
    current
}

struct InputNote {
    owner: [u8; 32], // keccak(owner_secret)
    owner_secret: [u8; 32], // keccak(ownerRSA.private_key)
    note_secret: [u8; 32], // owner of the note can decrypt with ownerRSA.privateKey
    asset_id: [u8; 20],
    amount_array: [u8; 32],
    amount: u64,

    leaf_index: [u8; 32],
    path: [Field; 20],
    path_data: [[u8; 32]; 20],
}

// only 1 withdrawal
fn main(
    root: pub [u8; 32],
    input_notes: [InputNote; 2],
    nullifiers: pub [[u8; 32]; 2],
    exit_amounts: pub [u64; 2],
) {
    let mut inputs_map: HashMap<[u8; 20], u64, 2, BuildHasherDefault<Poseidon2Hasher>> =
        HashMap::default();

    for i in 0..2 {
        if input_notes[i].amount != 0 {
            let sender_pub_key = std::hash::keccak256(input_notes[i].owner_secret, 32);

            assert(sender_pub_key == input_notes[i].owner, "invalid owner");

            let reconstructed_nullifier = calculate_nullifier(
                input_notes[i].leaf_index,
                input_notes[i].note_secret,
                input_notes[i].amount_array,
                input_notes[i].asset_id,
            );

            assert(reconstructed_nullifier == nullifiers[i]);

            let note_leaf = calculate_leaf(
                input_notes[i].owner,
                input_notes[i].amount_array,
                input_notes[i].asset_id,
                input_notes[i].note_secret,
            );

            let merkle_root = compute_keccak_merkle_hash(
                note_leaf,
                input_notes[i].path,
                input_notes[i].path_data,
            );

            assert(root == merkle_root, "Invalid merkle proof");

            inputs_map.insert(input_notes[i].asset_id, input_notes[i].amount);
        }
    }

    for i in 0..2 {
        assert(inputs_map.get(input_notes[i].asset_id).unwrap_unchecked() == exit_amounts[i]);
        println(exit_amounts[i]);
        println(inputs_map.get(input_notes[i].asset_id).unwrap_unchecked());
    }
}

#[test]
fn test_main() {
    let root = [
        83, 40, 64, 66, 152, 54, 245, 136, 36, 181, 239, 98, 216, 250, 131, 143, 252, 176, 78, 196,
        193, 103, 221, 168, 174, 89, 207, 19, 163, 52, 242, 20,
    ];
    let alice_input_note: InputNote = InputNote {
        owner: [
            167, 188, 107, 190, 235, 86, 176, 61, 213, 149, 237, 61, 209, 237, 120, 200, 162, 35,
            129, 210, 180, 202, 95, 140, 74, 35, 124, 120, 16, 157, 152, 148,
        ],
        owner_secret: [
            41, 78, 198, 202, 179, 133, 68, 149, 49, 232, 180, 33, 155, 3, 129, 152, 143, 232, 125,
            71, 211, 21, 3, 135, 83, 98, 158, 89, 177, 161, 73, 245,
        ],
        note_secret: [
            28, 66, 209, 70, 157, 177, 0, 83, 100, 219, 247, 162, 135, 122, 28, 57, 45, 120, 81,
            192, 122, 9, 68, 50, 134, 198, 251, 181, 122, 124, 130, 200,
        ],
        asset_id: [
            220, 100, 161, 64, 170, 62, 152, 17, 0, 169, 190, 202, 78, 104, 95, 150, 47, 12, 246,
            201,
        ],
        amount_array: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            1, 15, 44,
        ],
        amount: 69420,
        leaf_index: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0,
        ],
        path: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        path_data: [
            [
                147, 72, 63, 214, 134, 244, 46, 79, 5, 198, 194, 115, 38, 129, 123, 116, 217, 37,
                83, 141, 98, 192, 34, 61, 93, 242, 247, 66, 57, 179, 101, 178,
            ],
            [
                23, 191, 253, 119, 79, 159, 218, 145, 184, 177, 205, 84, 230, 157, 156, 5, 13, 88,
                11, 128, 40, 200, 78, 131, 174, 94, 167, 208, 84, 228, 252, 122,
            ],
            [
                82, 172, 58, 136, 209, 37, 247, 193, 203, 87, 79, 105, 242, 181, 145, 136, 120, 81,
                55, 134, 231, 121, 165, 223, 231, 54, 84, 16, 177, 80, 206, 206,
            ],
            [
                90, 101, 193, 27, 157, 114, 220, 35, 243, 178, 167, 190, 230, 149, 187, 25, 247, 22,
                0, 188, 192, 168, 30, 254, 169, 112, 42, 16, 128, 231, 203, 26,
            ],
            [
                196, 235, 96, 138, 85, 239, 99, 233, 242, 26, 49, 88, 36, 64, 79, 146, 25, 186, 217,
                71, 71, 13, 204, 127, 6, 105, 86, 15, 30, 164, 81, 101,
            ],
            [
                146, 67, 149, 84, 96, 80, 84, 239, 143, 44, 137, 240, 142, 167, 126, 232, 178, 37,
                77, 125, 15, 28, 114, 35, 68, 18, 31, 23, 47, 44, 147, 30,
            ],
            [
                141, 149, 246, 240, 135, 187, 141, 159, 75, 178, 202, 94, 243, 154, 9, 57, 54, 199,
                40, 119, 139, 163, 161, 51, 105, 36, 194, 179, 11, 243, 59, 49,
            ],
            [
                174, 72, 186, 5, 75, 64, 28, 247, 44, 98, 145, 39, 173, 16, 173, 104, 174, 18, 217,
                225, 83, 16, 83, 154, 19, 225, 109, 76, 69, 172, 206, 171,
            ],
            [
                121, 190, 49, 244, 246, 91, 230, 130, 33, 148, 72, 250, 246, 252, 245, 7, 182, 28,
                51, 37, 251, 4, 180, 248, 97, 77, 126, 226, 25, 102, 243, 112,
            ],
            [
                55, 138, 178, 232, 191, 182, 223, 156, 118, 170, 74, 253, 118, 255, 26, 242, 252,
                135, 12, 55, 1, 243, 206, 61, 229, 66, 49, 6, 65, 4, 123, 171,
            ],
            [
                83, 45, 180, 252, 96, 79, 240, 129, 248, 250, 176, 103, 122, 245, 98, 216, 14, 167,
                186, 95, 95, 19, 89, 214, 191, 93, 199, 37, 67, 201, 107, 68,
            ],
            [
                164, 78, 215, 86, 166, 112, 98, 240, 205, 174, 192, 67, 244, 84, 179, 224, 65, 146,
                77, 147, 60, 17, 125, 26, 122, 77, 115, 247, 112, 6, 112, 182,
            ],
            [
                78, 30, 141, 110, 236, 42, 118, 114, 23, 239, 25, 223, 34, 210, 236, 47, 216, 52,
                93, 185, 196, 85, 79, 102, 228, 144, 187, 158, 127, 145, 171, 42,
            ],
            [
                115, 222, 2, 68, 150, 174, 215, 212, 155, 79, 131, 62, 116, 25, 112, 183, 236, 150,
                90, 23, 252, 200, 69, 227, 99, 81, 134, 188, 80, 10, 240, 179,
            ],
            [
                211, 129, 142, 217, 128, 251, 5, 223, 132, 3, 66, 74, 177, 244, 168, 194, 254, 34,
                34, 230, 21, 238, 7, 35, 221, 240, 176, 160, 82, 40, 105, 239,
            ],
            [
                216, 160, 102, 73, 99, 253, 137, 184, 145, 214, 71, 188, 16, 92, 227, 214, 68, 2,
                123, 5, 24, 251, 11, 250, 102, 219, 123, 122, 224, 250, 79, 147,
            ],
            [
                58, 32, 21, 71, 107, 72, 23, 59, 237, 163, 77, 254, 113, 21, 251, 161, 254, 62, 155,
                14, 37, 150, 248, 11, 212, 27, 212, 46, 51, 119, 229, 57,
            ],
            [
                183, 208, 215, 18, 79, 55, 33, 1, 52, 36, 143, 1, 249, 117, 236, 105, 177, 164, 36,
                140, 18, 139, 88, 200, 4, 122, 88, 148, 131, 43, 173, 197,
            ],
            [
                133, 174, 72, 28, 58, 255, 83, 136, 69, 134, 75, 230, 11, 110, 233, 204, 61, 105,
                176, 254, 56, 229, 153, 118, 7, 18, 144, 166, 65, 197, 149, 238,
            ],
            [
                187, 45, 15, 39, 205, 44, 164, 14, 106, 203, 6, 81, 123, 127, 190, 120, 23, 175,
                113, 94, 187, 136, 221, 153, 104, 9, 140, 246, 211, 252, 216, 182,
            ],
        ],
    };
    let alice_nullifier = [
        253, 254, 30, 35, 69, 250, 236, 220, 194, 14, 94, 158, 200, 239, 115, 92, 34, 217, 82, 207,
        243, 75, 255, 78, 225, 175, 30, 12, 216, 150, 149, 50,
    ];
    let empty_input_note: InputNote = InputNote {
        owner: [0; 32],
        owner_secret: [0; 32],
        note_secret: [0; 32],
        asset_id: [0; 20],
        amount_array: [0; 32],
        amount: 0,
        leaf_index: [0; 32],
        path: [0; 20],
        path_data: [[0; 32]; 20],
    };

    main(
        root,
        [alice_input_note, empty_input_note],
        [alice_nullifier, [0; 32]],
        [69420, 0],
    );
}
