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
    // Range-bound every asset_amount before any arithmetic. See the same
    // bound in circuits/transfer/src/main.nr for the rationale: caps the
    // sums in assert_balanced below the BN254 modulus so Field addition
    // cannot wrap and let an attacker mint value out of nothing via the
    // withdrawal path.
    for i in 0..NOTE_COUNT {
        input_notes[i].asset_amount.assert_max_bit_size::<128>();
        output_notes[i].asset_amount.assert_max_bit_size::<128>();
    }

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

// ----- Test fixtures -------------------------------------------------
// Reuses the transfer circuit's tree state: alice's 5-USDC note at
// leaf_index 0 with the same root, asset_id, owner, secret, and merkle
// path. The split mirrors the transfer test (3 + 2) but bob's leg leaves
// the system through the external-withdrawal branch instead of being
// re-inserted into the tree.

#[test]
fn test_main() {
    let root = 4221110344891604176205088962198904729260430126413313722462390172704999703195;
    let asset_id = 1096978651789611665652906124278561787240579697095;
    let asset_amount = 5;
    let owner = 10812186542955647827474372651967207045861174805371180171801345448553285386806;
    let owner_secret =
        10036677144260647934022413515521823129584317400947571241312859176539726523915;
    let secret = 2389312107716289199307843900794656424062350252250388738019021107824217896920;

    let nullifier = 3889730504789135603011318287331683111639714777739573239289638917879152395137;
    let leaf_index = 0;
    let leaf = 15877031116292595040191017675338240539290338653409019794000313907399651592164;

    let path = [
        13640659629327953230197633652529006805891215582818597888084863207147219313784,
        19984673905358619496530873554532699316557532969285237470013525856790495658245,
        16054022188397161938956278061878851932956033792728066452148841350372709856325,
        5088416905632566847489144423785449560596474956704206833561295200206123281740,
        7133742548945823648162717112853949322814446130740022056636610844051076979955,
        15996976533936258369996214630141201173712053425083354410411158951568838211277,
        12856765864455281126306545538308148448222111081433610923407492298111988109924,
        4407863489559565071205165471845081321675763465852502126771740970311657294198,
        20448284296610764092326252358036828964180135505542140040145855516028834425624,
        7022843789375185322738689530892530453984779704784378294646894048972162829679,
        10906054357754859492130109809751867122631984061959461434096281674698176679467,
    ];
    let path_indices = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

    // Sanity: the witness path actually proves membership of `leaf`.
    let recon: Field = compute_merkle_root(leaf, path, path_indices);
    assert(recon == root, "Roots don't match");

    let input_note: InputNote = InputNote {
        asset_id,
        asset_amount,
        owner,
        owner_secret,
        secret,
        leaf_index,
        path,
        path_indices,
    };
    let empty_input_note: InputNote = InputNote {
        asset_id: 0,
        asset_amount: 0,
        owner: 0,
        owner_secret: 0,
        secret: 0,
        leaf_index: 0,
        path: [0; HEIGHT - 1],
        path_indices: [0; HEIGHT - 1],
    };
    let empty_output_note: OutputNote =
        OutputNote { owner: 0, secret: 0, asset_id: 0, asset_amount: 0, external_address: 0 };

    // Alice's change note (internal): same fixture as transfer/test_main.
    let alice_amount: Field = 3;
    let alice_secret: Field =
        19536471094918068928039225564664574556680178861106125446000998678966251111926;
    let alice_output_hash =
        8576856452718270547402366094981334736141859948414539161051536617849336979212;
    let alice_output_note: OutputNote = OutputNote {
        owner,
        secret: alice_secret,
        asset_id,
        asset_amount: alice_amount,
        external_address: 0,
    };

    // Bob's external withdrawal (analogue of the withdraw circuit's exit
    // path). Address is an arbitrary 160-bit field; the circuit only
    // requires the address-hash to commit to it.
    let bob_external: Field = 0xab5ef9a0c0aab35a4d61f3c4a5b1f2937fa01ad2;
    let bob_amount: Field = 2;
    let bob_exit_hash = poseidon2::Poseidon2::hash([bob_external], 1);
    let bob_output_note: OutputNote = OutputNote {
        owner: 0,
        secret: 0,
        asset_id,
        asset_amount: bob_amount,
        external_address: bob_external,
    };

    let input_notes = [input_note, empty_input_note, empty_input_note];
    let output_notes = [alice_output_note, bob_output_note, empty_output_note];
    let nullifiers = [nullifier, 0, 0];
    // Slot 0 (alice) is internal so it needs a commitment; slot 1 (bob)
    // is external so the hash slot is zero.
    let output_hashes = [alice_output_hash, 0, 0];
    let exit_assets = [0, asset_id, 0];
    let exit_amounts = [0, bob_amount, 0];
    let exit_addresses = [0, bob_external, 0];
    let exit_address_hashes = [0, bob_exit_hash, 0];

    main(
        root,
        input_notes,
        output_notes,
        nullifiers,
        output_hashes,
        exit_assets,
        exit_amounts,
        exit_addresses,
        exit_address_hashes,
    );
}

// Regression test for the BN254 field-overflow exploit on the external
// path. Without the 128-bit bound on asset_amount, an attacker could
// withdraw an arbitrary amount to an attacker-controlled address out of
// thin air by pairing it with a "sink" internal note whose amount is
// p - withdrawn, making out_sum wrap to 0 mod p and match a zero
// input side. The range check now rejects the sink amount before any
// witness is constructed.
#[test(should_fail)]
fn test_field_overflow_exploit_rejected() {
    let asset_id: Field = 1096978651789611665652906124278561787240579697095;
    let stolen_amount: Field = 5_000_000_000;
    let owner_attacker: Field =
        10812186542955647827474372651967207045861174805371180171801345448553285386806;
    let secret_attacker: Field =
        2389312107716289199307843900794656424062350252250388738019021107824217896920;
    let exit_addr: Field = 0xab5ef9a0c0aab35a4d61f3c4a5b1f2937fa01ad2;
    let exit_hash = poseidon2::Poseidon2::hash([exit_addr], 1);

    let sink_amount: Field = 0 - stolen_amount;
    let sink_leaf = reconstruct_leaf(asset_id, sink_amount, owner_attacker, secret_attacker);

    let empty_in: InputNote = InputNote {
        asset_id: 0,
        asset_amount: 0,
        owner: 0,
        owner_secret: 0,
        secret: 0,
        leaf_index: 0,
        path: [0; HEIGHT - 1],
        path_indices: [0; HEIGHT - 1],
    };
    let stolen_out: OutputNote = OutputNote {
        owner: 0,
        secret: 0,
        asset_id,
        asset_amount: stolen_amount,
        external_address: exit_addr,
    };
    let sink_out: OutputNote = OutputNote {
        owner: owner_attacker,
        secret: secret_attacker,
        asset_id,
        asset_amount: sink_amount,
        external_address: 0,
    };
    let empty_out: OutputNote =
        OutputNote { owner: 0, secret: 0, asset_id: 0, asset_amount: 0, external_address: 0 };

    main(
        0,
        [empty_in, empty_in, empty_in],
        [stolen_out, sink_out, empty_out],
        [0, 0, 0],
        [0, sink_leaf, 0],
        [asset_id, 0, 0],
        [stolen_amount, 0, 0],
        [exit_addr, 0, 0],
        [exit_hash, 0, 0],
    );
}
