pub fn main(pre_image: [u8; 32], output: [u8; 32]) {
    let current = std::hash::keccak256(pre_image, 32);

    println(current);

    assert(current == output, "invalid hash");
}

#[test]
fn test_main() {
    let pre_image: [u8; 32] = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0,
    ];
    let output: [u8; 32] = [
        41, 13, 236, 217, 84, 139, 98, 168, 214, 3, 69, 169, 136, 56, 111, 200, 75, 166, 188, 149,
        72, 64, 8, 246, 54, 47, 147, 22, 14, 243, 229, 99,
    ];

    main(pre_image, output);
}
