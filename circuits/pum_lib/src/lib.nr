use poseidon;
use poseidon::poseidon2;

global HEIGHT: u32 = 12;

pub fn calculate_leaf(asset_id: Field, asset_amount: Field, owner: Field, secret: Field) -> Field {
    let leaf_hash =
        poseidon::poseidon2::Poseidon2::hash([asset_id, asset_amount, owner, secret], 4);

    leaf_hash
}

pub fn compute_merkle_root(
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

pub fn compute_nullifier(
    leaf_index: Field,
    owner: Field,
    secret: Field,
    asset_id: Field,
    asset_amount: Field,
) -> Field {
    poseidon2::Poseidon2::hash([leaf_index, owner, secret, asset_id, asset_amount], 5)
}

pub fn reconstruct_leaf(
    asset_id: Field,
    asset_amount: Field,
    owner: Field,
    secret: Field,
) -> Field {
    poseidon2::Poseidon2::hash([asset_id, asset_amount, owner, secret], 4)
}
