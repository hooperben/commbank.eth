import { Noir } from "@noir-lang/noir_js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { UltraHonkBackend } from "@aztec/bb.js";

export const getTestingAPI = async <T = UltraHonkBackend>(
  backendClass?: new (bytecode: string) => T,
) => {
  const keccakFile = readFileSync(
    resolve("../circuits/target/circuits.json"),
    "utf-8",
  );
  const keccakNoteCircuit = JSON.parse(keccakFile);
  const circuit = new Noir(keccakNoteCircuit);

  backendClass ||= await (async () => {
    const { UltraHonkBackend } = await import("@aztec/bb.js");
    return UltraHonkBackend as unknown as NonNullable<typeof backendClass>;
  })();

  const noir = new Noir(keccakNoteCircuit);
  const backend = new backendClass(keccakNoteCircuit.bytecode);

  return { circuit, noir, backend };
};
