// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract PoseidonMerkleTree {
  // ──────────────────────────────────────────────────────────────────────────
  // Tree shape — change TREE_HEIGHT here and the rest follows automatically.
  // ──────────────────────────────────────────────────────────────────────────
  uint256 public constant TREE_HEIGHT = 12;
  uint256 public constant MAX_LEAF_INDEX = 1 << (TREE_HEIGHT - 1);

  // The maximum field element in BN254
  uint256 public constant PRIME =
    0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001;

  // Empty-leaf default: keccak256(abi.encodePacked("TANGERINE")) % PRIME
  uint256 public constant ZERO_LEAF =
    0x1e2856f9f722631c878a92dc1d84283d04b76df3e1831492bdf7098c1e65e478;

  // ──────────────────────────────────────────────────────────────────────────
  // Storage
  // ──────────────────────────────────────────────────────────────────────────

  // filledSubtrees keys are (epoch | level | index) so they don't collide
  // across epoch rollovers. See `_storageKey` for the encoding.
  mapping(uint256 => uint256) public filledSubtrees;

  // Every root that has ever existed is permanently valid. Membership proofs
  // generated against any historical root remain verifiable forever.
  mapping(uint256 => bool) public knownRoots;

  // zeros[i] = root of an empty subtree of height i (i.e. 2^i zero leaves
  // hashed together). Seeded once in `setPoseidon`. zeros[TREE_HEIGHT - 1]
  // is the root of an empty tree.
  mapping(uint256 => uint256) public zeros;

  // The current tree being filled. Both increment on rollover; nextIndex
  // resets to 0.
  uint256 public epoch;
  uint256 public nextIndex;

  // The most recent root produced by an insert into the active epoch.
  uint256 public currentRoot;

  address public poseidon2Hasher;
  address public deployer;

  // ──────────────────────────────────────────────────────────────────────────
  // Events
  // ──────────────────────────────────────────────────────────────────────────

  event LeafInserted(
    uint256 indexed epoch,
    uint256 indexed leafIndex,
    bytes32 leafValue
  );
  event EpochRolledOver(uint256 indexed oldEpoch, uint256 finalRoot);

  // ──────────────────────────────────────────────────────────────────────────
  // Construction
  // ──────────────────────────────────────────────────────────────────────────

  constructor() {
    deployer = msg.sender;
  }

  // Setting the hasher also seeds the zeros table and the initial root, so
  // changing TREE_HEIGHT requires no manual recomputation of constants.
  function setPoseidon(address _hasher) public {
    require(poseidon2Hasher == address(0), "Can't set it twice!");
    require(msg.sender == deployer, "only deployer can set poseidon");
    poseidon2Hasher = _hasher;

    uint256 z = ZERO_LEAF;
    zeros[0] = z;
    for (uint256 i = 1; i < TREE_HEIGHT; i++) {
      z = hashLeftRight(z, z);
      zeros[i] = z;
    }
    currentRoot = zeros[TREE_HEIGHT - 1];
    knownRoots[currentRoot] = true;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Insertion
  // ──────────────────────────────────────────────────────────────────────────

  function _insert(uint256 _leaf) internal returns (uint256 index) {
    if (nextIndex == MAX_LEAF_INDEX) {
      // Active tree is full - freeze its final root and start a new epoch (tree index).
      // currentRoot is already in knownRoots from the last insert; we just
      // emit so off-chain indexers can seal the previous tree cleanly.
      emit EpochRolledOver(epoch, currentRoot);
      epoch += 1;
      nextIndex = 0;
      currentRoot = zeros[TREE_HEIGHT - 1];
      // knownRoots[zeros[TREE_HEIGHT - 1]] was set in setPoseidon and is
      // permanent, so we don't need to re-add it.
    }

    uint256 insertIndex = nextIndex;
    uint256 currentIndex = insertIndex;
    uint256 currentHash = _leaf;
    uint256 _epoch = epoch;

    filledSubtrees[_storageKey(_epoch, 0, currentIndex)] = currentHash;

    for (uint256 i = 0; i < TREE_HEIGHT - 1; i++) {
      bool isLeft = currentIndex % 2 == 0;
      uint256 siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;

      uint256 sibling = filledSubtrees[_storageKey(_epoch, i, siblingIndex)];
      if (sibling == 0) {
        sibling = zeros[i];
      }

      currentHash = isLeft
        ? hashLeftRight(currentHash, sibling)
        : hashLeftRight(sibling, currentHash);

      currentIndex = currentIndex / 2;
      filledSubtrees[_storageKey(_epoch, i + 1, currentIndex)] = currentHash;
    }

    currentRoot = currentHash;
    knownRoots[currentHash] = true;

    nextIndex = insertIndex + 1;
    emit LeafInserted(_epoch, insertIndex, bytes32(_leaf));

    return insertIndex;
  }

  // (epoch, level, index) packed into a single uint256.
  // - index occupies bits [0, 32)   — supports trees up to 2^32 leaves
  // - level occupies bits [32, 64)  — supports heights up to 2^32
  // - epoch occupies bits [64, 256) — effectively unbounded
  function _storageKey(
    uint256 _epoch,
    uint256 level,
    uint256 index
  ) internal pure returns (uint256) {
    return (_epoch << 64) | (level << 32) | index;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Hashing & root membership
  // ──────────────────────────────────────────────────────────────────────────

  function hashLeftRight(
    uint256 _left,
    uint256 _right
  ) public view returns (uint256) {
    bytes memory callData = abi.encode(_left, _right);

    (bool success, bytes memory result) = poseidon2Hasher.staticcall(callData);
    require(success, "Poseidon2 hash failed");

    return abi.decode(result, (uint256));
  }

  function isKnownRoot(uint256 _root) public view returns (bool) {
    if (_root == 0) {
      return false;
    }
    return knownRoots[_root];
  }
}
