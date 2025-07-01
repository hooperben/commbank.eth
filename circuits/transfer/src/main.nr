global HEIGHT: u32 = 12;
global NOTE_COUNT: u32 = 3;

use std::{collections::map::HashMap, hash::{BuildHasherDefault, poseidon2::Poseidon2Hasher}};
use std::hash::poseidon2;

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

fn compute_merkle_root(
    leaf: Field,
    path: [Field; HEIGHT - 1],
    path_indices: [Field; HEIGHT - 1],
) -> Field {
    let mut current = leaf;
    for i in 0..HEIGHT - 1 {
        let path_bit = path_indices[i];
        let (hash_left, hash_right) = if path_bit == 0 {
            (path[i], current)
        } else {
            (current, path[i])
        };
        current = poseidon2::Poseidon2::hash([hash_left, hash_right], 2);
    }
    current
}

fn compute_nullifier(
    leaf_index: Field,
    owner: Field,
    secret: Field,
    asset_id: Field,
    asset_amount: Field,
) -> Field {
    poseidon2::Poseidon2::hash([leaf_index, owner, secret, asset_id, asset_amount], 5)
}

fn reconstruct_leaf(asset_id: Field, asset_amount: Field, owner: Field, secret: Field) -> Field {
    poseidon2::Poseidon2::hash([asset_id, asset_amount, owner, secret], 4)
}

fn main(
    root: pub Field,
    input_notes: [InputNote; NOTE_COUNT],
    output_notes: [OutputNote; NOTE_COUNT],
    nullifiers: pub [Field; NOTE_COUNT],
    output_hashes: pub [Field; NOTE_COUNT],
) {
    let mut inputs_map: HashMap<Field, Field, 12, BuildHasherDefault<Poseidon2Hasher>> =
        HashMap::default();
    let mut outputs_map: HashMap<Field, Field, 12, BuildHasherDefault<Poseidon2Hasher>> =
        HashMap::default();

    for i in 0..NOTE_COUNT - 1 {
        // if note is not empty
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

            let current_asset_amount = inputs_map.get(input_notes[i].asset_id).unwrap_or(0);
            inputs_map.insert(
                input_notes[i].asset_id,
                current_asset_amount + input_notes[i].asset_amount,
            );
        }

        if output_notes[i].asset_amount != 0 {
            let output_leaf_note = reconstruct_leaf(
                output_notes[i].asset_id,
                output_notes[i].asset_amount,
                output_notes[i].owner,
                output_notes[i].secret,
            );
            assert(output_leaf_note == output_hashes[i]);

            let current_asset_amount = outputs_map.get(output_notes[i].asset_id).unwrap_or(0);
            outputs_map.insert(
                output_notes[i].asset_id,
                current_asset_amount + output_notes[i].asset_amount,
            )
        }
    }

    // check input and output asset keys are equal
    assert(inputs_map.len() == outputs_map.len());

    for i in 0..NOTE_COUNT - 1 {
        assert(
            inputs_map.get(input_notes[i].asset_id).unwrap_or(0)
                == outputs_map.get(input_notes[i].asset_id).unwrap_or(0),
        );
    }
}

#[test]
fn test_main() {
    let root = 4221110344891604176205088962198904729260430126413313722462390172704999703195;
    let asset_id = 1096978651789611665652906124278561787240579697095;
    let asset_amount = 5;
    let owner = 10812186542955647827474372651967207045861174805371180171801345448553285386806;
    let owner_secret =
        10036677144260647934022413515521823129584317400947571241312859176539726523915; // TODO
    let secret = 2389312107716289199307843900794656424062350252250388738019021107824217896920;

    let nullifier = 3889730504789135603011318287331683111639714777739573239289638917879152395137;

    let leaf_index = 0;

    // this is the empty tree after the hash 9194668555912557146241026266248928483973497222045579120388006164958747201268
    // is inserted at index 0
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

    let recon_merkle_root = compute_merkle_root(leaf, path, path_indices);

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
    let nullifiers = [nullifier, 0, 0];
    let empty_output_note: OutputNote =
        OutputNote { owner: 0, secret: 0, asset_id: 0, asset_amount: 0 };
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

    let input_notes = [input_note, empty_input_note, empty_input_note];

    let alice_output_note: OutputNote = OutputNote {
        owner: 10812186542955647827474372651967207045861174805371180171801345448553285386806,
        secret: 19536471094918068928039225564664574556680178861106125446000998678966251111926,
        asset_id: 1096978651789611665652906124278561787240579697095,
        asset_amount: 3
    };
    let alice_output_hash = 8576856452718270547402366094981334736141859948414539161051536617849336979212;

    let bob_output_note: OutputNote = OutputNote {
        owner: 6868973719921785236727144517868768664734231208097695530688003960085654392226,
        secret: 3957740128091467064337395812164919758932045173069261808814882570720300029469,
        asset_id: 1096978651789611665652906124278561787240579697095,
        asset_amount: 2
    };
    let bob_output_hash = 4033300113401483633011546954450009404136112133461230452107665732116532508739;
    let output_notes = [alice_output_note, bob_output_note, empty_output_note];

    let output_hashes = [alice_output_hash, bob_output_hash, 0];

    main(root, input_notes, output_notes, nullifiers, output_hashes);
}
