// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./utils/Poseidon2.sol";

contract PoseidonMerkleTree {
    using Field for *;

    // The root of a poseidon2 merkle tree with height 12 and all leaf nodes filled with:
    // EMPTY_LEAF = keccak256(abi.encodePacked("TANGERINE")) % FIELD_MODULUS
    uint256 public constant INITIAL_ROOT =
        0x124005ad54174bbcb8c2dd053ea318daa80106cdcc518731504b771d6006123f;

    // The maximum field that can be hashed in our poseidon2 order
    uint256 public constant MAX_VALUE = Field.PRIME;

    // filledSubtrees and roots could be bytes32[size], but using mappings makes it cheaper because
    // it removes index range check on every interaction
    mapping(uint256 => uint256) public filledSubtrees;
    mapping(uint256 => uint256) public roots;

    uint256 public immutable height; // 12

    uint32 public constant ROOT_HISTORY_SIZE = 100;
    uint32 public currentRootIndex = 0;
    uint256 public nextIndex = 0;

    uint256 public MAX_LEAF_INDEX;

    Poseidon2 poseidon2Hasher;

    constructor(uint256 _height) {
        height = _height;
        MAX_LEAF_INDEX = 2 ** (_height - 1);

        poseidon2Hasher = new Poseidon2();

        roots[0] = uint256(INITIAL_ROOT);
    }

    function zeros(uint256 i) public pure returns (uint256) {
        if (i == 0) {
            // Base ZERO_VALUE: keccak256(abi.encodePacked("TANGERINE")) % FIELD_MODULUS
            return
                uint256(
                    0x1e2856f9f722631c878a92dc1d84283d04b76df3e1831492bdf7098c1e65e478
                );
        } else if (i == 1) {
            return
                uint256(
                    0x2c2eecb1b14035bfd9765e84195684b401a84fdb58c3c03f1bcea86dcf0c8105
                );
        } else if (i == 2) {
            return
                uint256(
                    0x237e412a71db31e5769f63d92346a09dd0f30b9c335e9d9aa96b6625eb537445
                );
        } else if (i == 3) {
            return
                uint256(
                    0x0b3ff120d61a7de2da3d80ff99d393796805c74be5c39e8a4c7436d1c65dad4c
                );
        } else if (i == 4) {
            return
                uint256(
                    0x0fc58e21665302678bef68714d9e5889583071f7bd3cf018b64fafc51b0a9cf3
                );
        } else if (i == 5) {
            return
                uint256(
                    0x235df7c585524ed8a26aea20a0fb168038f10df71d84720c9a8c1b3e78e3b6cd
                );
        } else if (i == 6) {
            return
                uint256(
                    0x1c6cabee394ea24dc09eab1788f7f62b367e95789f883e33690d94215d819264
                );
        } else if (i == 7) {
            return
                uint256(
                    0x09bec327ab2c8dda5d2d435cd267cb21e71f21371a01739885817eb1625d8976
                );
        } else if (i == 8) {
            return
                uint256(
                    0x2d35519ad7061578be50cbbfe040327843f6b4cdf1458e01b5f9737dbaf82b18
                );
        } else if (i == 9) {
            return
                uint256(
                    0x0f86c9e9c9e689394a4944bb87291a3f55cc930b21432fccf41b8267f1a98d6f
                );
        } else if (i == 10) {
            return
                uint256(
                    0x181c9ba70900093b180c96f55cc2b1d73d60b8ab613344cbba83b33cbcc94e2b
                );
        } else {
            revert("Index out of bounds");
        }
    }

    event LeafInserted(uint256 indexed leafIndex, uint256 indexed leafValue);

    // Add a helper function to generate consistent keys
    function getStorageKey(
        uint256 level,
        uint256 index
    ) internal pure returns (uint256) {
        return (level << 32) | index; // Combine level and index into a single key
    }

    function _insert(uint256 _leaf) internal returns (uint256 index) {
        uint256 insertIndex = nextIndex;
        require(insertIndex != MAX_LEAF_INDEX, "Tree Full");

        uint256 currentIndex = insertIndex;
        uint256 currentHash = _leaf;

        // Store leaf at level 0
        filledSubtrees[getStorageKey(0, currentIndex)] = currentHash;

        for (uint256 i = 0; i < height - 1; i++) {
            bool isLeft = currentIndex % 2 == 0;
            uint256 siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;

            // Get sibling value using consistent key generation
            uint256 siblingKey = getStorageKey(i, siblingIndex);
            uint256 sibling = filledSubtrees[siblingKey];
            if (sibling == 0) {
                sibling = zeros(i);
            }

            // Calculate parent hash based on position
            if (isLeft) {
                currentHash = hashLeftRight(currentHash, sibling);
            } else {
                currentHash = hashLeftRight(sibling, currentHash);
            }

            // Move up to parent level
            currentIndex = currentIndex / 2;

            // Store the computed hash for the next level using consistent key
            filledSubtrees[getStorageKey(i + 1, currentIndex)] = currentHash;
        }

        uint32 newRootIndex = (currentRootIndex + 1) % ROOT_HISTORY_SIZE;
        currentRootIndex = newRootIndex;
        roots[newRootIndex] = currentHash;

        nextIndex = insertIndex + 1;
        emit LeafInserted(insertIndex, _leaf);

        return insertIndex;
    }

    function hashLeftRight(
        uint256 _left,
        uint256 _right
    ) public view returns (uint256) {
        return
            poseidon2Hasher
                .hash_2(uint256(_left).toField(), uint256(_right).toField())
                .toUint256();
    }

    function isKnownRoot(uint256 _root) public view returns (bool) {
        if (_root == 0) {
            return false;
        }
        uint32 _currentRootIndex = currentRootIndex;
        uint32 i = _currentRootIndex;
        do {
            if (_root == roots[i]) {
                return true;
            }
            if (i == 0) {
                i = ROOT_HISTORY_SIZE;
            }
            i--;
        } while (i != _currentRootIndex);
        return false;
    }
}
