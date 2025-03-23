import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import { resolve } from "path";
import { readFileSync } from "fs";

export const getNoir = async <T = UltraHonkBackend>(
  filePath: string,
  backendClass?: new (bytecode: string) => T,
) => {
  const circuitFile = readFileSync(resolve(filePath), "utf-8");
  const keccakNoteCircuit = JSON.parse(circuitFile);
  const circuit = new Noir(keccakNoteCircuit);

  backendClass ||= await (async () => {
    const { UltraHonkBackend } = await import("@aztec/bb.js");
    return UltraHonkBackend as unknown as NonNullable<typeof backendClass>;
  })();

  const noir = new Noir(keccakNoteCircuit);
  const backend = new backendClass(keccakNoteCircuit.bytecode);

  return {
    noir,
    backend,
  };
};
