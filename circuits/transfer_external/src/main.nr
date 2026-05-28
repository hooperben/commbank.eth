use poseidon::poseidon2;
use pum_lib::{compute_merkle_root, compute_nullifier, reconstruct_leaf, HEIGHT};

// Transfer-with-withdrawal circuit. Drop-in analogue of `transfer`
// plus an external-withdrawal branch per output slot. Hash helpers
// and HEIGHT are imported from `pum_lib` to keep all circuits in
// lockstep on tree layout and nullifier domain separator; the
// balance-conservation logic stays local to this file (same as
// `transfer`).
//
// Per output slot:
//   - If `external_address == 0`, it's an internal note: its
//     commitment must equal the public `output_hashes[i]` slot, and
//     it gets re-inserted into the tree on-chain.
//   - If `external_address != 0`, it's a withdrawal: the on-chain
//     contract pays `exit_amounts[i]` of `exit_assets[i]` to the
//     EVM address `exit_addresses[i]`. Frontrun resistance comes
//     from the prover committing to `poseidon([address], 1) ==
//     exit_address_hashes[i]` -- so a mempool watcher cannot rewrite
//     the recipient without invalidating the proof.
//
// The balance invariant still applies: every asset_id moving through
// the circuit, internal or withdrawn, contributes to its side's sum.
// `assert_balanced` is identical to the `transfer` circuit.

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
    // Pass 1: per-note verification.
    for i in 0..NOTE_COUNT {
        if input_notes[i].asset_amount != 0 {
            // Owner derivation.
            let owner_pub_key =
                poseidon2::Poseidon2::hash([input_notes[i].owner_secret], 1);
            assert(owner_pub_key == input_notes[i].owner);

            // Nullifier consistency.
            let reconstructed_nullifier = compute_nullifier(
                input_notes[i].leaf_index,
                input_notes[i].owner,
                input_notes[i].secret,
                input_notes[i].asset_id,
                input_notes[i].asset_amount,
            );
            assert(reconstructed_nullifier == nullifiers[i]);

            // Merkle membership at `root`.
            let reconstructed_leaf = reconstruct_leaf(
                input_notes[i].asset_id,
                input_notes[i].asset_amount,
                input_notes[i].owner,
                input_notes[i].secret,
            );
            let reconstructed_root = compute_merkle_root(
                reconstructed_leaf,
                input_notes[i].path,
                input_notes[i].path_indices,
            );
            assert(reconstructed_root == root);
        }

        if output_notes[i].asset_amount != 0 {
            if output_notes[i].external_address != 0 {
                // Withdrawal: exit parameters must echo the note's
                // own (asset_id, amount, recipient) so the on-chain
                // contract pays out exactly what the proof attests.
                assert(exit_assets[i] == output_notes[i].asset_id);
                assert(exit_amounts[i] == output_notes[i].asset_amount);
                assert(exit_addresses[i] == output_notes[i].external_address);

                // Frontrun resistance: the public hash is what's
                // checked on-chain; anyone rewriting `exit_addresses[i]`
                // in the mempool invalidates this commitment.
                let frontrun_hash =
                    poseidon2::Poseidon2::hash([exit_addresses[i]], 1);
                assert(frontrun_hash == exit_address_hashes[i]);
            } else {
                // Internal output: commitment must match the public
                // output_hashes slot. The contract re-inserts the
                // leaf into the tree off the back of this proof.
                let output_leaf = reconstruct_leaf(
                    output_notes[i].asset_id,
                    output_notes[i].asset_amount,
                    output_notes[i].owner,
                    output_notes[i].secret,
                );
                assert(output_leaf == output_hashes[i]);
            }
        }
    }

    // Pass 2: balance invariant. Internal + external outputs both
    // count -- whether the asset stays in the tree or leaves to a
    // public address, the input/output sums for that asset_id must
    // match.
    assert_balanced(input_notes, output_notes);
}

// Constrained per-asset balance check. See circuits/transfer/src/main.nr
// for the full rationale: mask-multiply over fixed-size arrays, two
// passes (input-side then output-side) so any asset appearing only
// on the output side is anchored in Pass B and fails when its input
// sum is zero. Empty notes contribute 0 arithmetically because their
// asset_amount is 0; no explicit empty-mask needed inside the inner
// loop.
fn assert_balanced(
    input_notes: [InputNote; NOTE_COUNT],
    output_notes: [OutputNote; NOTE_COUNT],
) {
    // Pass A: anchor on each non-empty input asset_id.
    for i in 0..NOTE_COUNT {
        if input_notes[i].asset_amount != 0 {
            let anchor = input_notes[i].asset_id;
            let mut in_sum: Field = 0;
            let mut out_sum: Field = 0;
            for j in 0..NOTE_COUNT {
                let in_match: Field = (input_notes[j].asset_id == anchor) as Field;
                let out_match: Field = (output_notes[j].asset_id == anchor) as Field;
                in_sum += input_notes[j].asset_amount * in_match;
                out_sum += output_notes[j].asset_amount * out_match;
            }
            assert(in_sum == out_sum);
        }
    }

    // Pass B: anchor on each non-empty output asset_id. Catches
    // assets that appear only on the output side (mint attempts),
    // including via the external withdrawal path.
    for i in 0..NOTE_COUNT {
        if output_notes[i].asset_amount != 0 {
            let anchor = output_notes[i].asset_id;
            let mut in_sum: Field = 0;
            let mut out_sum: Field = 0;
            for j in 0..NOTE_COUNT {
                let in_match: Field = (input_notes[j].asset_id == anchor) as Field;
                let out_match: Field = (output_notes[j].asset_id == anchor) as Field;
                in_sum += input_notes[j].asset_amount * in_match;
                out_sum += output_notes[j].asset_amount * out_match;
            }
            assert(in_sum == out_sum);
        }
    }
}
