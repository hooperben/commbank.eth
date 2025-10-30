import { getNoirClasses } from "@/helpers/test-suite/get-noir-classes";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

async function main() {
  const { depositBackend, transferBackend, withdrawBackend, warpBackend } =
    getNoirClasses();

  // Ensure verifiers directory exists
  const verifiersDir = join(__dirname, "../contracts/verifiers");
  try {
    mkdirSync(verifiersDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, that's fine
    console.error(error);
  }

  // Build deposit verifier (1/4)
  console.log("Building deposit verifier (1/4)");
  try {
    const depositVerifier = await depositBackend.getSolidityVerifier();
    const depositContract = depositVerifier.replace(
      /contract HonkVerifier/g,
      "contract DepositVerifier",
    );
    writeFileSync(join(verifiersDir, "DepositVerifier.sol"), depositContract);
    console.log("Deposit copied to contracts/verifiers/DepositVerifier.sol");
  } catch (error) {
    console.error("Error building deposit verifier:", error);
    throw error;
  }

  // Build transfer verifier (2/4)
  console.log("Building transfer verifier (2/4)");
  try {
    const transferVerifier = await transferBackend.getSolidityVerifier();
    const transferContract = transferVerifier.replace(
      /contract HonkVerifier/g,
      "contract TransferVerifier",
    );
    writeFileSync(join(verifiersDir, "TransferVerifier.sol"), transferContract);
    console.log("Transfer copied to contracts/verifiers/TransferVerifier.sol");
  } catch (error) {
    console.error("Error building transfer verifier:", error);
    throw error;
  }

  // Build withdraw verifier (3/4)
  console.log("Building withdraw verifier (3/4)");
  try {
    const withdrawVerifier = await withdrawBackend.getSolidityVerifier();
    const withdrawContract = withdrawVerifier.replace(
      /contract HonkVerifier/g,
      "contract WithdrawVerifier",
    );
    writeFileSync(join(verifiersDir, "WithdrawVerifier.sol"), withdrawContract);
    console.log("Withdraw copied to contracts/verifiers/WithdrawVerifier.sol");
  } catch (error) {
    console.error("Error building withdraw verifier:", error);
    throw error;
  }

  // Build warp verifier (4/4)
  console.log("Building warp verifier (4/4)");
  try {
    const warpVerifier = await warpBackend.getSolidityVerifier();
    const warpContract = warpVerifier.replace(
      /contract HonkVerifier/g,
      "contract WarpVerifier",
    );
    console.log(warpVerifier);
    writeFileSync(join(verifiersDir, "WarpVerifier.sol"), warpContract);
    console.log("Warp copied to contracts/verifiers/WarpVerifier.sol");
  } catch (error) {
    console.error("Error building warp verifier:", error);
    throw error;
  }

  console.log("All verifiers built and exported successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
