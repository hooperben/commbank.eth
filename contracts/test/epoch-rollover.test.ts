import { PoseidonMerkleTree } from "@/helpers/poseidon-merkle-tree";
import { TREE_HEIGHT } from "@/helpers/tree-config";
import { expect } from "chai";
import { ethers } from "ethers";
import { network } from "hardhat";
import Poseidon2HuffJson from "../contracts/utils/Poseidon2Huff.json";

describe("PoseidonMerkleTree epoch rollover", () => {
  let tree: ethers.Contract;
  let signer: ethers.Signer;
  let MAX: bigint;

  beforeEach(async () => {
    const connection = await network.connect();
    [signer] = await connection.ethers.getSigners();

    const TreeFactory = await connection.ethers.getContractFactory(
      "TestablePoseidonMerkleTree",
    );
    tree = (await TreeFactory.deploy()) as unknown as ethers.Contract;
    await tree.waitForDeployment();

    const poseidonFactory = new ethers.ContractFactory(
      [],
      Poseidon2HuffJson.bytecode,
      signer,
    );
    const poseidon = await poseidonFactory.deploy();
    await poseidon.waitForDeployment();
    await tree.setPoseidon(await poseidon.getAddress());

    MAX = await tree.MAX_LEAF_INDEX();
  });

  it("starts at epoch 0 with the empty-tree root permanently known", async () => {
    expect(await tree.epoch()).to.equal(0n);
    expect(await tree.nextIndex()).to.equal(0n);

    const initialRoot = await tree.currentRoot();
    expect(initialRoot).to.not.equal(0n);
    expect(await tree.isKnownRoot(initialRoot)).to.equal(true);

    // Sentinel: zero is never a valid root
    expect(await tree.isKnownRoot(0n)).to.equal(false);
    // An arbitrary value is not a known root
    expect(await tree.isKnownRoot(123n)).to.equal(false);
  });

  it("setPoseidon cannot be called twice", async () => {
    await expect(
      tree.setPoseidon(await signer.getAddress()),
    ).to.be.revertedWith("Can't set it twice!");
  });

  it("inserting one leaf advances nextIndex, updates currentRoot, and adds it to knownRoots", async () => {
    const before = await tree.currentRoot();
    await tree.publicInsert(123n);

    expect(await tree.epoch()).to.equal(0n);
    expect(await tree.nextIndex()).to.equal(1n);

    const after = await tree.currentRoot();
    expect(after).to.not.equal(before);
    expect(await tree.isKnownRoot(after)).to.equal(true);
    // Old root remains valid forever
    expect(await tree.isKnownRoot(before)).to.equal(true);
  });

  it("on-chain root matches off-chain TS tree after several inserts", async () => {
    const offTree = new PoseidonMerkleTree(TREE_HEIGHT);
    // initializeDefaultNodes is async but not awaited in the constructor;
    // give it a tick before reading roots
    await new Promise((r) => setTimeout(r, 100));

    for (let i = 0; i < 5; i++) {
      const leaf = BigInt(i + 1);
      await tree.publicInsert(leaf);
      await offTree.insert(leaf, i);
      const onChain = (await tree.currentRoot()) as bigint;
      const offChain = await offTree.getRoot();
      expect(onChain.toString()).to.equal(offChain.toString());
    }
  });

  it("rolls over when nextIndex hits MAX_LEAF_INDEX and emits EpochRolledOver", async () => {
    // Place us at the last slot of epoch 0
    await tree.setNextIndex(MAX - 1n);
    await tree.publicInsert(111n);
    expect(await tree.epoch()).to.equal(0n);
    expect(await tree.nextIndex()).to.equal(MAX);
    const finalRootEpoch0 = (await tree.currentRoot()) as bigint;

    // Next insert triggers rollover
    const tx = await tree.publicInsert(222n);
    const receipt = await tx.wait();

    expect(await tree.epoch()).to.equal(1n);
    expect(await tree.nextIndex()).to.equal(1n);

    const rolloverEvents = receipt!.logs.filter(
      (l: { fragment?: { name: string } }) =>
        l.fragment?.name === "EpochRolledOver",
    );
    expect(rolloverEvents.length).to.equal(1);
    expect(rolloverEvents[0].args[0]).to.equal(0n);
    expect(rolloverEvents[0].args[1]).to.equal(finalRootEpoch0);

    const leafEvents = receipt!.logs.filter(
      (l: { fragment?: { name: string } }) =>
        l.fragment?.name === "LeafInserted",
    );
    expect(leafEvents.length).to.equal(1);
    expect(leafEvents[0].args[0]).to.equal(1n); // new epoch
    expect(leafEvents[0].args[1]).to.equal(0n); // first leaf of new epoch

    // Frozen root remains permanently valid
    expect(await tree.isKnownRoot(finalRootEpoch0)).to.equal(true);
  });

  it("preserves every historical root across multiple epoch rollovers", async () => {
    // epoch 0: capture two roots
    await tree.publicInsert(1n);
    const r0a = (await tree.currentRoot()) as bigint;
    await tree.publicInsert(2n);
    const r0b = (await tree.currentRoot()) as bigint;

    // jump to end and trigger rollover into epoch 1
    await tree.setNextIndex(MAX);
    await tree.publicInsert(3n);
    const r1a = (await tree.currentRoot()) as bigint;
    expect(await tree.epoch()).to.equal(1n);

    // and again into epoch 2
    await tree.setNextIndex(MAX);
    await tree.publicInsert(4n);
    const r2a = (await tree.currentRoot()) as bigint;
    expect(await tree.epoch()).to.equal(2n);

    for (const r of [r0a, r0b, r1a, r2a]) {
      expect(await tree.isKnownRoot(r)).to.equal(true);
    }
  });

  it("each new epoch starts inserting at index 0 with a fresh subtree", async () => {
    // Fill a few slots in epoch 0
    await tree.publicInsert(10n);
    await tree.publicInsert(20n);
    expect(await tree.nextIndex()).to.equal(2n);

    // Roll over
    await tree.setNextIndex(MAX);
    await tree.publicInsert(30n); // lands at epoch 1, index 0
    expect(await tree.epoch()).to.equal(1n);
    expect(await tree.nextIndex()).to.equal(1n);

    // The root after inserting one leaf into a fresh tree must equal what an
    // independent off-chain tree of the same height produces with one insert.
    const offTree = new PoseidonMerkleTree(TREE_HEIGHT);
    await new Promise((r) => setTimeout(r, 100));
    await offTree.insert(30n, 0);

    const onChain = (await tree.currentRoot()) as bigint;
    const offChain = await offTree.getRoot();
    expect(onChain.toString()).to.equal(offChain.toString());
  });
});
