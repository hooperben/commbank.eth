global HEIGHT: u32 = 12;
global NOTE_COUNT: u32 = 3;

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
    nullifiers: pub [Field; NOTE_COUNT],
    exit_assets: pub [Field; NOTE_COUNT],
    exit_amounts: pub [Field; NOTE_COUNT],
    exit_addresses: pub [Field; NOTE_COUNT],
    exit_address_hashes: pub [Field; NOTE_COUNT],
) {
    for i in 0..NOTE_COUNT - 1 {
        if input_notes[i].asset_amount != 0 {
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
            assert(exit_assets[i] == input_notes[i].asset_id);
            assert(exit_amounts[i] == input_notes[i].asset_amount);

            let frontrun_hash = poseidon2::Poseidon2::hash([exit_addresses[i]], 1);
            assert(frontrun_hash == exit_address_hashes[i]);
        }
    }
}

#[test]
fn test_main() {
    let root = 9770762522284292133040204594656801249089743659015207279808423545223243067226;
    let asset_id = 1096978651789611665652906124278561787240579697095;
    let asset_amount = 2;

    let exit_addresses = [asset_id, 0, 0];
    let exit_hash = poseidon2::Poseidon2::hash([asset_id], 1);
    let exit_address_hashes = [exit_hash, 0, 0];

    let bob_input_note: InputNote = InputNote {
        asset_id,
        asset_amount,
        owner: 6868973719921785236727144517868768664734231208097695530688003960085654392226,
        owner_secret: 6955001134965379637962992480442037189090898019061077075663294923529403402038,
        secret: 3957740128091467064337395812164919758932045173069261808814882570720300029469,
        leaf_index: 2,
        path: [
            13640659629327953230197633652529006805891215582818597888084863207147219313784,
            18380261439356865501884569257940638985761619337694138929913102368174989083576,
            16054022188397161938956278061878851932956033792728066452148841350372709856325,
            5088416905632566847489144423785449560596474956704206833561295200206123281740,
            7133742548945823648162717112853949322814446130740022056636610844051076979955,
            15996976533936258369996214630141201173712053425083354410411158951568838211277,
            12856765864455281126306545538308148448222111081433610923407492298111988109924,
            4407863489559565071205165471845081321675763465852502126771740970311657294198,
            20448284296610764092326252358036828964180135505542140040145855516028834425624,
            7022843789375185322738689530892530453984779704784378294646894048972162829679,
            10906054357754859492130109809751867122631984061959461434096281674698176679467,
        ],
        path_indices: [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

    let bob_input_nullifier =
        4114950840897945428984428368446053738282984086981274614627600851726952485197;

    let output_asset = asset_id;
    let output_asset_amount = asset_amount;

    let input_notes = [bob_input_note, empty_input_note, empty_input_note];
    let nullifiers = [bob_input_nullifier, 0, 0];
    let exit_assets = [asset_id, 0, 0];
    let exit_amounts = [asset_amount, 0, 0];

    main(
        root,
        input_notes,
        nullifiers,
        exit_assets,
        exit_amounts,
        exit_addresses,
        exit_address_hashes,
    );
}
