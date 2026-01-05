use poseidon::poseidon2::{self, Poseidon2Hasher};
use pum_lib::{self, compute_merkle_root, compute_nullifier, reconstruct_leaf};
use std::{collections::map::HashMap, hash::BuildHasherDefault};

global HEIGHT: u32 = 12;
global NOTE_COUNT: u32 = 3;

struct InputNote {
    asset_id: Field,
    asset_amount: Field,
    owner: Field,
    owner_secret: Field,
    secret: Field,
    leaf_index: Field,
    path: [Field; HEIGHT - 1],
    path_indices: [Field; HEIGHT - 1],
}

struct OutputNote {
    owner: Field,
    secret: Field,
    asset_id: Field,
    asset_amount: Field,
    external_address: Field,
}

fn main(
    root: pub Field,
    input_notes: [InputNote; NOTE_COUNT],
    output_notes: [OutputNote; NOTE_COUNT],
    nullifiers: pub [Field; NOTE_COUNT],
    output_hashes: pub [Field; NOTE_COUNT],
    exit_assets: pub [Field; NOTE_COUNT],
    exit_amounts: pub [Field; NOTE_COUNT],
    exit_addresses: pub [Field; NOTE_COUNT],
    exit_address_hashes: pub [Field; NOTE_COUNT],
) {
    let mut inputs_map: HashMap<Field, Field, NOTE_COUNT, BuildHasherDefault<Poseidon2Hasher>> =
        HashMap::default();
    let mut outputs_map: HashMap<Field, Field, NOTE_COUNT, BuildHasherDefault<Poseidon2Hasher>> =
        HashMap::default();

    // Process input notes - validate ownership, nullifiers, and merkle membership
    for i in 0..NOTE_COUNT - 1 {
        if input_notes[i].asset_amount != 0 {
            // check owner is correct
            let owner_pub_key = poseidon2::Poseidon2::hash([input_notes[i].owner_secret], 1);
            assert(owner_pub_key == input_notes[i].owner);

            // check nullifier is correct
            let reconstructed_nullifier = compute_nullifier(
                input_notes[i].leaf_index,
                input_notes[i].owner,
                input_notes[i].secret,
                input_notes[i].asset_id,
                input_notes[i].asset_amount,
            );
            assert(reconstructed_nullifier == nullifiers[i]);

            // check merkle membership
            let reconstructed_leaf = reconstruct_leaf(
                input_notes[i].asset_id,
                input_notes[i].asset_amount,
                input_notes[i].owner,
                input_notes[i].secret,
            );
            let reconstructed_merkle_root = compute_merkle_root(
                reconstructed_leaf,
                input_notes[i].path,
                input_notes[i].path_indices,
            );
            assert(reconstructed_merkle_root == root);

            // track input amounts
            let current_asset_amount = inputs_map.get(input_notes[i].asset_id).unwrap_or(0);
            inputs_map.insert(
                input_notes[i].asset_id,
                current_asset_amount + input_notes[i].asset_amount,
            );
        }
    }

    // Process output notes - handle both internal transfers and external withdrawals
    for i in 0..NOTE_COUNT - 1 {
        if output_notes[i].asset_amount != 0 {
            if output_notes[i].external_address != 0 {
                // This is a withdrawal - validate exit parameters
                assert(exit_assets[i] == output_notes[i].asset_id);
                assert(exit_amounts[i] == output_notes[i].asset_amount);
                assert(exit_addresses[i] == output_notes[i].external_address);

                // Prevent frontrunning by hashing the exit address
                let frontrun_hash = poseidon2::Poseidon2::hash([exit_addresses[i]], 1);
                assert(frontrun_hash == exit_address_hashes[i]);
            } else {
                // This is an internal transfer - validate output hash
                let output_leaf_note = reconstruct_leaf(
                    output_notes[i].asset_id,
                    output_notes[i].asset_amount,
                    output_notes[i].owner,
                    output_notes[i].secret,
                );
                assert(output_leaf_note == output_hashes[i]);
            }

            // track output amounts (both internal and external)
            let current_asset_amount = outputs_map.get(output_notes[i].asset_id).unwrap_or(0);
            outputs_map.insert(
                output_notes[i].asset_id,
                current_asset_amount + output_notes[i].asset_amount,
            );
        }
    }

    // Ensure input and output amounts match for each asset
    assert(inputs_map.len() == outputs_map.len());

    for i in 0..NOTE_COUNT - 1 {
        assert(
            inputs_map.get(input_notes[i].asset_id).unwrap_or(0)
                == outputs_map.get(input_notes[i].asset_id).unwrap_or(0),
        );
    }
}
