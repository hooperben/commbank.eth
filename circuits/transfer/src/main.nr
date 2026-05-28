use poseidon::poseidon2;
use pum_lib::{compute_merkle_root, compute_nullifier, HEIGHT, reconstruct_leaf};

// Internal-transfer circuit. Hash helpers (leaf reconstruction,
// merkle root, nullifier) and the tree height live in `pum_lib` so
// every circuit -- deposit, transfer, transfer_external, withdraw --
// stays in lockstep on tree layout and nullifier domain separator.
// The balance-conservation logic stays local to this file: only
// transfer and transfer_external need it, and it pairs tightly with
// the per-note verification in main().
//
// Protocol shape: each transfer spends up to NOTE_COUNT existing
// notes (input_notes) and creates up to NOTE_COUNT new notes
// (output_notes). Slots not used by the user are filled with empty
// notes whose `asset_amount == 0`. The circuit proves:
//
//   1. Each non-empty input is owned by the prover and exists in the
//      tree at `root`. Its nullifier is consistent with its content.
//   2. Each non-empty output's commitment matches the public
//      `output_hashes[i]`.
//   3. For every asset_id present on either side, the input and
//      output amounts balance. Multi-asset is supported -- a single
//      transfer can move multiple distinct asset_ids -- with the
//      mint hole closed by anchoring the balance check from both
//      the input and output sides.

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
}

fn main(
    root: pub Field,
    input_notes: [InputNote; NOTE_COUNT],
    output_notes: [OutputNote; NOTE_COUNT],
    nullifiers: pub [Field; NOTE_COUNT],
    output_hashes: pub [Field; NOTE_COUNT],
) {
    // Pass 1: per-note verification.
    // Inputs: owner derivation + nullifier + merkle membership.
    // Outputs: commitment matches the public output_hashes slot.
    // Empty notes (asset_amount == 0) are skipped on both sides.
    for i in 0..NOTE_COUNT {
        if input_notes[i].asset_amount != 0 {
            let owner_pub_key = poseidon2::Poseidon2::hash([input_notes[i].owner_secret], 1);
            assert(owner_pub_key == input_notes[i].owner);

            let reconstructed_nullifier = compute_nullifier(
                input_notes[i].leaf_index,
                input_notes[i].owner,
                input_notes[i].secret,
                input_notes[i].asset_id,
                input_notes[i].asset_amount,
            );
            assert(reconstructed_nullifier == nullifiers[i]);

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
            let output_leaf = reconstruct_leaf(
                output_notes[i].asset_id,
                output_notes[i].asset_amount,
                output_notes[i].owner,
                output_notes[i].secret,
            );
            assert(output_leaf == output_hashes[i]);
        }
    }

    // Pass 2: balance invariant.
    assert_balanced(input_notes, output_notes);
}

// Constrained per-asset balance check.
//
// For every value-bearing position on either side, anchor on its
// asset_id, sum all input contributions matching that anchor, sum
// all output contributions matching it, and assert equal. Running
// from both the input side AND the output side closes the mint hole:
// an asset_id present only on the output side gets anchored in
// Pass B and its zero input sum fails the assert.
//
// Empty notes contribute 0 to either sum (their asset_amount is 0),
// so no explicit empty mask is needed inside the inner loop -- their
// slot drops out arithmetically.
//
// Cost at NOTE_COUNT = 3: up to 6 outer iterations x 3 inner = 18
// mask-multiply ops per side, well under 100 constraints
fn assert_balanced(input_notes: [InputNote; NOTE_COUNT], output_notes: [OutputNote; NOTE_COUNT]) {
    // Pass A: anchor on each non-empty input asset_id.
    for i in 0..NOTE_COUNT {
        if input_notes[i].asset_amount != 0 {
            let anchor = input_notes[i].asset_id;
            let mut in_sum: Field = 0;
            let mut out_sum: Field = 0;
            for j in 0..NOTE_COUNT {
                // bool -> Field (0 or 1) gates each slot's contribution.
                let in_match: Field = (input_notes[j].asset_id == anchor) as Field;
                let out_match: Field = (output_notes[j].asset_id == anchor) as Field;
                in_sum += input_notes[j].asset_amount * in_match;
                out_sum += output_notes[j].asset_amount * out_match;
            }
            assert(in_sum == out_sum);
        }
    }

    // Pass B: anchor on each non-empty output asset_id. Catches
    // assets that appear only on the output side (mint attempts).
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

// ----- Test fixture --------------------------------------------------
// Same witness values as the existing `transfer` circuit's test so
// the migration is provably semantics-preserving on honest inputs.
// 1 USDC input (amount 5) splits into 2 USDC outputs (amounts 3 + 2)
// to a different owner. Slot 2 is empty on both sides.

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
        OutputNote { owner: 0, secret: 0, asset_id: 0, asset_amount: 0 };

    let alice_output_note: OutputNote = OutputNote {
        owner: 10812186542955647827474372651967207045861174805371180171801345448553285386806,
        secret: 19536471094918068928039225564664574556680178861106125446000998678966251111926,
        asset_id: 1096978651789611665652906124278561787240579697095,
        asset_amount: 3,
    };
    let alice_output_hash =
        8576856452718270547402366094981334736141859948414539161051536617849336979212;

    let bob_output_note: OutputNote = OutputNote {
        owner: 6868973719921785236727144517868768664734231208097695530688003960085654392226,
        secret: 3957740128091467064337395812164919758932045173069261808814882570720300029469,
        asset_id: 1096978651789611665652906124278561787240579697095,
        asset_amount: 2,
    };
    let bob_output_hash =
        4033300113401483633011546954450009404136112133461230452107665732116532508739;

    let input_notes = [input_note, empty_input_note, empty_input_note];
    let nullifiers = [nullifier, 0, 0];
    let output_notes = [alice_output_note, bob_output_note, empty_output_note];
    let output_hashes = [alice_output_hash, bob_output_hash, 0];

    main(root, input_notes, output_notes, nullifiers, output_hashes);
}
