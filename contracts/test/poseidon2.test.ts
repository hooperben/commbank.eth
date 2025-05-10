import { BarretenbergSync, Fr } from "@aztec/bb.js";

describe("poiseidon2 hashes et cetera", () => {
  before(() => {});

  it.only("test", async () => {
    const api = await BarretenbergSync.initSingleton();
    const hash = api.poseidon2Hash([new Fr(1n), new Fr(2n)]);

    // Hash an array of bigints
    console.log(hash); // Returns a single bigint hash value

    console.log(hash.toString());

    // 21888242871839275222246405745257275088548364400416034343698204186575808495617n
    const MAX_VALUE = BigInt(
      "0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001",
    );

    console.log(MAX_VALUE);

    // const hexString = "0x" + hash.toString(16);
    // console.log(hexString);
  });
});
