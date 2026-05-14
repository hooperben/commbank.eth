// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "../PoseidonMerkleTree.sol";

// Test-only harness: exposes `_insert` so we can verify tree mechanics without
// going through CommBankDotEth, and lets us fast-forward `nextIndex` so we can
// exercise rollover without paying for 2^(TREE_HEIGHT - 1) inserts.
contract TestablePoseidonMerkleTree is PoseidonMerkleTree {
  function publicInsert(uint256 _leaf) external returns (uint256) {
    return _insert(_leaf);
  }

  function setNextIndex(uint256 _nextIndex) external {
    nextIndex = _nextIndex;
  }
}
