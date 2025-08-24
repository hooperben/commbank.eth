const core = require("@actions/core");
const fs = require("fs");
const { PinataSDK } = require("pinata");

async function run() {
  try {
    // Get inputs
    const pinataJwt = core.getInput("pinata-jwt");
    const pinataGateway = core.getInput("pinata-gateway");
    const sourceDir = core.getInput("source-dir");
    const pinName = core.getInput("pin-name");
    const updateExisting = core.getInput("update-existing") === "true";

    // Initialize Pinata SDK
    const pinata = new PinataSDK({
      pinataJwt: pinataJwt,
      pinataGateway: pinataGateway,
    });

    // Test authentication
    try {
      await pinata.testAuthentication();
      console.log("✅ Pinata authentication successful");
    } catch (authError) {
      console.error("❌ Pinata authentication failed:", authError.message);
      throw new Error("Pinata authentication failed. Check your JWT token.");
    }

    // Check if source directory exists
    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Source directory ${sourceDir} does not exist`);
    }

    // If updating existing, try to find and remove old version
    if (updateExisting) {
      try {
        const existingFiles = await pinata.files.list({
          metadata: {
            name: pinName,
          },
          limit: 1,
        });

        if (existingFiles.files && existingFiles.files.length > 0) {
          const oldFile = existingFiles.files[0];
          console.log(`🗑️ Removing old version: ${oldFile.ipfs_pin_hash}`);
          await pinata.unpin(oldFile.ipfs_pin_hash);
        }
      } catch (error) {
        console.log("⚠️ Could not remove old version:", error.message);
      }
    }

    console.log(`📁 Uploading directory: ${sourceDir}`);
    console.log("🚀 Uploading to IPFS...");

    // Upload directory to IPFS using the folder method
    const result = await pinata.upload.folder(sourceDir, {
      name: pinName,
      metadata: {
        keyvalues: {
          deployment: "github-actions",
          repository: process.env.GITHUB_REPOSITORY || "commbank.eth",
          commit: process.env.GITHUB_SHA || "unknown",
          branch: process.env.GITHUB_REF_NAME || "unknown",
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log("✅ Upload successful!");
    console.log(`📍 IPFS Hash: ${result.IpfsHash}`);

    const gatewayUrl = `https://${pinataGateway}/ipfs/${result.IpfsHash}`;
    console.log(`🌍 Gateway URL: ${gatewayUrl}`);

    // Set outputs
    core.setOutput("ipfs-hash", result.IpfsHash);
    core.setOutput("gateway-url", gatewayUrl);

    // Create a summary
    await core.summary
      .addHeading("🌐 IPFS Deployment Successful! 🎉")
      .addTable([
        ["Property", "Value"],
        ["IPFS Hash", `\`${result.IpfsHash}\``],
        ["Gateway URL", `[${gatewayUrl}](${gatewayUrl})`],
        ["Pin Name", pinName],
        ["Source Directory", sourceDir],
        ["Upload Size", formatBytes(result.PinSize)],
      ])
      .write();
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    core.setFailed(`Action failed: ${error.message}`);
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

run();
