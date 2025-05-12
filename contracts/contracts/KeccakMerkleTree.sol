// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract KeccakMerkleTree {
    uint256 public depth; // Depth of the Merkle tree
    bytes32[] public nodes; // Array representing the entire tree nodes
    uint256 public nextLeafIndex = 0; // Tracks where the next leaf should go
    uint256 public maxLeaves; // Maximum leaves based on depth

    uint32 public immutable levels = 20;

    mapping(uint256 => bytes32) public filledSubtrees;
    mapping(uint256 => bytes32) public roots;

    uint32 public constant ROOT_HISTORY_SIZE = 100;
    uint32 public currentRootIndex = 0;
    uint32 public nextIndex = 0;

    constructor() {}

    function zeros(uint256 i) public pure returns (bytes32) {
        if (i == 0) {
            return
                bytes32(
                    0x93483fd686f42e4f05c6c27326817b74d925538d62c0223d5df2f74239b365b2
                );
        }
        if (i == 1) {
            return
                bytes32(
                    0x17bffd774f9fda91b8b1cd54e69d9c050d580b8028c84e83ae5ea7d054e4fc7a
                );
        }
        if (i == 2) {
            return
                bytes32(
                    0x52ac3a88d125f7c1cb574f69f2b5918878513786e779a5dfe7365410b150cece
                );
        }
        if (i == 3) {
            return
                bytes32(
                    0x5a65c11b9d72dc23f3b2a7bee695bb19f71600bcc0a81efea9702a1080e7cb1a
                );
        }
        if (i == 4) {
            return
                bytes32(
                    0xc4eb608a55ef63e9f21a315824404f9219bad947470dcc7f0669560f1ea45165
                );
        }
        if (i == 5) {
            return
                bytes32(
                    0x92439554605054ef8f2c89f08ea77ee8b2254d7d0f1c722344121f172f2c931e
                );
        }
        if (i == 6) {
            return
                bytes32(
                    0x8d95f6f087bb8d9f4bb2ca5ef39a093936c728778ba3a1336924c2b30bf33b31
                );
        }
        if (i == 7) {
            return
                bytes32(
                    0xae48ba054b401cf72c629127ad10ad68ae12d9e15310539a13e16d4c45acceab
                );
        }
        if (i == 8) {
            return
                bytes32(
                    0x79be31f4f65be682219448faf6fcf507b61c3325fb04b4f8614d7ee21966f370
                );
        }
        if (i == 9) {
            return
                bytes32(
                    0x378ab2e8bfb6df9c76aa4afd76ff1af2fc870c3701f3ce3de542310641047bab
                );
        }
        if (i == 10) {
            return
                bytes32(
                    0x532db4fc604ff081f8fab0677af562d80ea7ba5f5f1359d6bf5dc72543c96b44
                );
        }
        if (i == 11) {
            return
                bytes32(
                    0xa44ed756a67062f0cdaec043f454b3e041924d933c117d1a7a4d73f7700670b6
                );
        }
        if (i == 12) {
            return
                bytes32(
                    0x4e1e8d6eec2a767217ef19df22d2ec2fd8345db9c4554f66e490bb9e7f91ab2a
                );
        }
        if (i == 13) {
            return
                bytes32(
                    0x73de024496aed7d49b4f833e741970b7ec965a17fcc845e3635186bc500af0b3
                );
        }
        if (i == 14) {
            return
                bytes32(
                    0xd3818ed980fb05df8403424ab1f4a8c2fe2222e615ee0723ddf0b0a0522869ef
                );
        }
        if (i == 15) {
            return
                bytes32(
                    0xd8a0664963fd89b891d647bc105ce3d644027b0518fb0bfa66db7b7ae0fa4f93
                );
        }
        if (i == 16) {
            return
                bytes32(
                    0x3a2015476b48173beda34dfe7115fba1fe3e9b0e2596f80bd41bd42e3377e539
                );
        }
        if (i == 17) {
            return
                bytes32(
                    0xb7d0d7124f37210134248f01f975ec69b1a4248c128b58c8047a5894832badc5
                );
        }
        if (i == 18) {
            return
                bytes32(
                    0x85ae481c3aff538845864be60b6ee9cc3d69b0fe38e59976071290a641c595ee
                );
        }
        if (i == 19) {
            return
                bytes32(
                    0xbb2d0f27cd2ca40e6acb06517b7fbe7817af715ebb88dd9968098cf6d3fcd8b6
                );
        }

        return bytes32(0);
    }

    function _insert(bytes32 leaf) internal returns (uint32 index) {
        uint32 insertIndex = nextIndex; // Store the insertion index
        require(insertIndex != 2 ** (levels - 1), "Merkle tree is full");

        uint32 current_index = insertIndex; // Use a separate variable for tree traversal
        bytes32 current_level_hash = leaf;
        bytes32 left;
        bytes32 right;

        for (uint256 i = 0; i < levels; i++) {
            if (current_index % 2 == 0) {
                left = current_level_hash;
                right = zeros(i);

                filledSubtrees[i] = current_level_hash;
            } else {
                left = filledSubtrees[i];
                right = current_level_hash;
            }

            current_level_hash = hashLeftRight(left, right);

            current_index /= 2;
        }

        uint32 newRootIndex = (currentRootIndex + 1) % ROOT_HISTORY_SIZE;
        currentRootIndex = newRootIndex;
        roots[newRootIndex] = current_level_hash;
        nextIndex = insertIndex + 1; // Increment nextIndex based on the original insertion index

        return insertIndex; // Return the index where this leaf was inserted
    }

    function hashLeftRight(
        bytes32 _left,
        bytes32 _right
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked([uint256(_left), uint256(_right)]));
    }

    /**
      @dev Whether the root is present in the root history
    */
    function isKnownRoot(bytes32 _root) public view returns (bool) {
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

    /**
      @dev Returns the last root
    */
    function getLastRoot() public view returns (bytes32) {
        return roots[currentRootIndex];
    }
}
