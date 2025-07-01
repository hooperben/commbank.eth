use std::hash::poseidon2;

fn calculate_leaf(asset_id: Field, asset_amount: Field, owner: Field, secret: Field) -> Field {
    let leaf_hash = poseidon2::Poseidon2::hash([asset_id, asset_amount, owner, secret], 4);

    leaf_hash
}

fn main(
    hash: pub Field,
    asset_id: pub Field,
    asset_amount: pub Field,
    owner: Field,
    secret: Field,
) {
    let reconstructed_leaf = calculate_leaf(asset_id, asset_amount, owner, secret);

    assert(reconstructed_leaf == hash);
}

#[test]
fn test_main() {
    let hash = 15877031116292595040191017675338240539290338653409019794000313907399651592164;
    let asset_id = 1096978651789611665652906124278561787240579697095;
    let amount = 5;
    let owner = 10812186542955647827474372651967207045861174805371180171801345448553285386806;
    let secret = 2389312107716289199307843900794656424062350252250388738019021107824217896920;

    main(hash, asset_id, amount, owner, secret);
}
