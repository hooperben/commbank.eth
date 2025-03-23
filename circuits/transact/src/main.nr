use bignum::{params::BigNumParams, RuntimeBigNum};
use std::{collections::map::HashMap, hash::{BuildHasherDefault, poseidon2::Poseidon2Hasher}};

pub fn calculate_nullifier(
    leaf_index: [u8; 32], // TODO investigate length
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

struct OutputNote {
    owner: [u8; 32],
    secret: [u8; 32],
    asset_id: [u8; 20],
    amount_array: [u8; 32],
    amount: u64,
}

fn main(
    root: pub [u8; 32],
    input_notes: [InputNote; 2],
    output_notes: [OutputNote; 2],
    nullifiers: pub [[u8; 32]; 2],
    output_hashes: pub [[u8; 32]; 2],
) {
    // we use this to track our inputs and outputs counts
    let mut inputs_map: HashMap<[u8; 20], u64, 2, BuildHasherDefault<Poseidon2Hasher>> =
        HashMap::default();
    let mut outputs_map: HashMap<[u8; 20], u64, 2, BuildHasherDefault<Poseidon2Hasher>> =
        HashMap::default();

    for i in 0..2 {
        if input_notes[i].amount != 0 {
            let sender_pub_key = std::hash::keccak256(input_notes[i].owner_secret, 32);

            assert(sender_pub_key == input_notes[i].owner_secret, "invalid owner");

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
        if output_notes[i].amount != 0 {
            let output_leaf_note = calculate_leaf(
                input_notes[i].owner,
                input_notes[i].amount_array,
                input_notes[i].asset_id,
                input_notes[i].note_secret,
            );

            assert(output_leaf_note == output_hashes[i], "invalid hash");

            outputs_map.insert(
                output_notes[i].asset_id,
                outputs_map.get(output_notes[i].asset_id).unwrap_unchecked()
                    + output_notes[i].amount,
            );
        }
    }

    assert(inputs_map.len() == outputs_map.len());

    for i in 0..2 {
        if (inputs_map.get(input_notes[i].asset_id).unwrap_unchecked() != 0) {
            assert(
                inputs_map.get(input_notes[i].asset_id).unwrap_unchecked()
                    == outputs_map.get(output_notes[i].asset_id).unwrap_unchecked(),
            );
        }
    }
}
