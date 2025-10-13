// Type representing a field element in the Aztec crypto system
type Fr = { toString(): string };

// Type for the poseidon2Hash function
type Poseidon2Hash = (inputs: bigint[]) => Promise<Fr>;

export const loadPoseidon = async (): Promise<Poseidon2Hash> => {
  const importModule = new Function(
    'return import("@aztec/foundation/crypto")',
  );
  const module = await importModule();
  return module.poseidon2Hash;
};
