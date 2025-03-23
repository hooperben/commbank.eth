import { MerkleTree } from "merkletreejs";
import { toUtf8Bytes, keccak256, hexlify } from "ethers";

export const TREE_HEIGHT = 20;
export const EMPTY_NOTE = keccak256(toUtf8Bytes("COMMBANK_DOT_ETH"));

export const getEmptyTree = () => {
  const emptyNotes = Array(2 ** 20).fill(EMPTY_NOTE);

  const tree = new MerkleTree(emptyNotes, keccak256, {
    sort: false,
    complete: true,
  });

  return tree;
};

export function generateZerosFunction(levels: number = 20) {
  // Helper function to get zeros at each level
  function getZeros() {
    // Start with level 0 (leaves)
    const zeros: string[] = [EMPTY_NOTE];

    // For each level, compute the hash of two child zeros
    for (let i = 1; i < levels; i++) {
      // In the contract, hashLeftRight is keccak256(abi.encodePacked([uint256(left), uint256(right)]))
      const combined =
        "0x" +
        zeros[i - 1].slice(2).padStart(64, "0") +
        zeros[i - 1].slice(2).padStart(64, "0");
      const hash = keccak256(combined);
      zeros.push(hash);
    }

    return zeros;
  }

  const zeros = getZeros();

  // Generate the Solidity code
  let code = `function zeros(uint256 i) public pure returns (bytes32) {`;

  // Add if-statements for each level (in reverse because in the tree, level 0 is leaves, but in contract level 0 might be root)
  for (let i = 0; i < levels; i++) {
    code += `
    if (i == ${i}) {
        return bytes32(${hexlify(zeros[i])});
    }`;
  }

  // Add default return
  code += `

    return bytes32(0);
}`;

  console.log(code);
  return code;
}
