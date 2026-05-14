import { PoseidonMerkleTree } from "@/helpers/poseidon-merkle-tree";
import { TREE_HEIGHT } from "@/helpers/tree-config";
import { keccak256, toUtf8Bytes } from "ethers";
import * as path from "path";

const ZERO_VALUE =
  BigInt(keccak256(toUtf8Bytes("TANGERINE"))) %
  BigInt("0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001");

const LEVELS = TREE_HEIGHT;
const TREE_CACHE_PATH = path.join(`./cache/full-tree-h${LEVELS}.json`);

export const getMerkleTree = async () => {
  // Try to load existing tree first
  let tree: PoseidonMerkleTree;
  try {
    tree = await PoseidonMerkleTree.loadFromFile(TREE_CACHE_PATH);
  } catch (error) {
    console.log("❌ No cached tree found, building new one...");
    tree = new PoseidonMerkleTree(LEVELS);

    const totalLeaves = 2 ** LEVELS;
    const insertPromises = [];
    for (let i = 0; i < totalLeaves; i++) {
      insertPromises.push(tree.insert(ZERO_VALUE, i));
    }

    await Promise.all(insertPromises);

    // Save for future use
    await tree.saveToFile(TREE_CACHE_PATH);
  }

  return tree;
};
