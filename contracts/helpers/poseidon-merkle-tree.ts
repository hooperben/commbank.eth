import { poseidon2Hash } from "@zkpassport/poseidon2";

export class PoseidonMerkleTree {
  private levels: number;
  private hashMap: Map<string, bigint>;
  private defaultNodes: bigint[];
  private nextIndex: number;
  private currentRootIndex: number;
  private filledSubtrees: Record<string, bigint | null>;
  private roots: Record<string, bigint>;
  private leaves: bigint[];
  private zeros: bigint | null;
  public insertedLeaves: Set<number>;

  constructor(levels: number) {
    this.levels = levels;
    this.hashMap = new Map();
    this.defaultNodes = new Array(levels);
    this.initializeDefaultNodes();
    this.nextIndex = 0;
    this.currentRootIndex = 0;
    this.filledSubtrees = {};
    this.roots = {};
    this.leaves = new Array(2 ** levels);
    this.zeros = null;
    this.insertedLeaves = new Set();
  }

  private async initializeDefaultNodes() {
    // Initialize with the same zero value used in Solidity
    // ZERO_VALUE = keccak256(abi.encodePacked("TANGERINE")) % FIELD_MODULUS
    this.defaultNodes[0] = BigInt(
      "0x1e2856f9f722631c878a92dc1d84283d04b76df3e1831492bdf7098c1e65e478",
    );

    // Calculate default nodes for each level
    for (let i = 1; i < this.levels; i++) {
      this.defaultNodes[i] = poseidon2Hash([
        this.defaultNodes[i - 1],
        this.defaultNodes[i - 1],
      ]);
    }
  }

  private getKey(level: number, index: number): string {
    return `${level}:${index}`;
  }

  public async insert(leaf: bigint | string, index: number) {
    if (index < 0 || index >= 2 ** this.levels) {
      throw new Error("Leaf index out of bounds");
    }

    // Convert input to Fr type
    let value = BigInt(leaf);

    // Track this leaf as inserted
    this.insertedLeaves.add(index);
    this.nextIndex = Math.max(this.nextIndex, index + 1);

    // Insert leaf
    let currentIndex = index;
    let currentHash = value;
    this.hashMap.set(this.getKey(0, currentIndex), currentHash);

    // Calculate parent nodes
    for (let i = 0; i < this.levels - 1; i++) {
      const isLeft = currentIndex % 2 === 0;
      const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;
      const siblingKey = this.getKey(i, siblingIndex);

      let sibling = this.hashMap.get(siblingKey);
      if (!sibling) {
        sibling = this.defaultNodes[i];
      }

      // Calculate parent hash
      currentHash = poseidon2Hash(
        isLeft ? [currentHash, sibling] : [sibling, currentHash],
      );

      // Move up one level
      currentIndex = Math.floor(currentIndex / 2);
      this.hashMap.set(this.getKey(i + 1, currentIndex), currentHash);
    }
  }

  public async getRoot(): Promise<bigint> {
    const rootKey = this.getKey(this.levels - 1, 0);
    const root = this.hashMap.get(rootKey);
    return root || this.defaultNodes[this.levels - 1];
  }

  public async getProof(
    index: number,
  ): Promise<{ siblings: bigint[]; indices: number[] }> {
    if (index < 0 || index >= 2 ** this.levels) {
      throw new Error("Leaf index out of bounds");
    }

    const siblings: bigint[] = [];
    const indices: number[] = [];
    let currentIndex = index;

    for (let i = 0; i < this.levels - 1; i++) {
      const isLeft = currentIndex % 2 === 0;
      const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;
      const siblingKey = this.getKey(i, siblingIndex);

      let sibling = this.hashMap.get(siblingKey);
      if (!sibling) {
        sibling = this.defaultNodes[i];
      }

      siblings.push(sibling);
      indices.push(isLeft ? 1 : 0);
      currentIndex = Math.floor(currentIndex / 2);
    }

    return { siblings, indices };
  }

  public static async verifyProof(
    root: bigint,
    leaf: bigint | string,
    proof: { siblings: bigint[]; indices: number[] },
  ): Promise<boolean> {
    let currentHash = typeof leaf === "string" ? BigInt(leaf) : leaf;

    for (let i = 0; i < proof.siblings.length; i++) {
      currentHash = await poseidon2Hash(
        proof.indices[i] === 0
          ? [proof.siblings[i], currentHash]
          : [currentHash, proof.siblings[i]],
      );
    }

    return currentHash == root;
  }

  public async getLeafValue(leafIndex: number): Promise<bigint> {
    if (leafIndex < 0 || leafIndex >= 2 ** this.levels) {
      throw new Error("Leaf index out of bounds");
    }

    // Get the leaf value from the hashMap at level 0
    const leafKey = this.getKey(0, leafIndex);
    const leafValue = this.hashMap.get(leafKey);

    // If the leaf doesn't exist in the hashMap, return the default value (zero)
    return leafValue || this.defaultNodes[0];
  }

  /**
   * Serialize the tree to JSON format
   */
  toJSON(): string {
    // Convert hashMap to plain object for JSON serialization
    const hashMapObj: Record<string, string> = {};
    for (const [key, value] of this.hashMap.entries()) {
      hashMapObj[key] = value.toString();
    }

    // Convert defaultNodes to strings
    const defaultNodesObj = this.defaultNodes.map((node) => node.toString());

    const treeData = {
      levels: this.levels,
      nextIndex: this.nextIndex,
      currentRootIndex: this.currentRootIndex,

      // Save the actual tree data
      hashMap: hashMapObj,
      defaultNodes: defaultNodesObj,
      insertedLeaves: Array.from(this.insertedLeaves),

      // Metadata
      timestamp: Date.now(),
      version: "1.0",
    };

    return JSON.stringify(treeData);
  }

  /**
   * Load tree from JSON format
   */
  static async fromJSON(jsonString: string): Promise<PoseidonMerkleTree> {
    const data = JSON.parse(jsonString);

    const tree = new PoseidonMerkleTree(data.levels);

    // Wait for default nodes to be initialized
    await tree.initializeDefaultNodes();

    // Restore state
    tree.nextIndex = data.nextIndex || 0;
    tree.currentRootIndex = data.currentRootIndex || 0;

    // Restore insertedLeaves
    if (data.insertedLeaves) {
      tree.insertedLeaves = new Set(data.insertedLeaves);
    }

    // Restore hashMap
    tree.hashMap.clear();
    if (data.hashMap) {
      for (const [key, valueString] of Object.entries(data.hashMap)) {
        tree.hashMap.set(key, BigInt(valueString as string));
      }
    }

    // Restore defaultNodes
    if (data.defaultNodes) {
      tree.defaultNodes = (data.defaultNodes as string[]).map((nodeString) =>
        BigInt(nodeString),
      );
    }

    return tree;
  }

  /**
   * Save tree to file
   */
  async saveToFile(filepath: string): Promise<void> {
    const fs = await import("fs/promises");
    await fs.writeFile(filepath, this.toJSON(), "utf8");
  }

  /**
   * Load tree from file
   */
  static async loadFromFile(filepath: string): Promise<PoseidonMerkleTree> {
    const fs = await import("fs/promises");
    const jsonString = await fs.readFile(filepath, "utf8");
    return await PoseidonMerkleTree.fromJSON(jsonString);
  }
}
