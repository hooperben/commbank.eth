import { ethers } from "hardhat";
import fs from "fs/promises";
import path from "path";

// ENS Registry and Resolver contract addresses on Ethereum mainnet
const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const ENS_PUBLIC_RESOLVER_ADDRESS =
  "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63";

// ENS Registry ABI (minimal required functions)
const ENS_REGISTRY_ABI = [
  "function resolver(bytes32 node) external view returns (address)",
  "function setResolver(bytes32 node, address resolver) external",
  "function owner(bytes32 node) external view returns (address)",
];

// ENS Public Resolver ABI (minimal required functions)
const ENS_RESOLVER_ABI = [
  "function contenthash(bytes32 node) external view returns (bytes memory)",
  "function setContenthash(bytes32 node, bytes calldata hash) external",
];

interface DeploymentConfig {
  ensNode: string;
  domain: string;
  ipfsHash?: string;
}

function namehash(name: string): string {
  if (!name)
    return "0x0000000000000000000000000000000000000000000000000000000000000000";

  const labels = name.split(".");
  let node =
    "0x0000000000000000000000000000000000000000000000000000000000000000";

  for (let i = labels.length - 1; i >= 0; i--) {
    const labelHash = ethers.keccak256(ethers.toUtf8Bytes(labels[i]));
    node = ethers.keccak256(ethers.concat([node, labelHash]));
  }

  return node;
}

function encodeIPFSHash(ipfsHash: string): string {
  // Remove 'Qm' prefix if present (CIDv0) and convert to CIDv1
  const cleanHash = ipfsHash.startsWith("Qm") ? ipfsHash.slice(2) : ipfsHash;

  // IPFS content hash encoding for ENS
  // 0xe3 = IPFS hash type, 0x01 = hash function (sha2-256), 0x20 = hash length (32 bytes)
  const prefix = "0xe301012020"; // IPFS multihash prefix for CIDv1
  const hashBytes = ethers.hexlify(ethers.decodeBase58(ipfsHash));

  return prefix + hashBytes.slice(2); // Remove '0x' from hash
}

async function getLatestIPFSHash(): Promise<string> {
  const hashFile = path.join(__dirname, "../temp/latest-ipfs-hash.txt");

  try {
    const hash = await fs.readFile(hashFile, "utf-8");
    return hash.trim();
  } catch (error) {
    throw new Error(
      `Could not read IPFS hash from ${hashFile}. Run 'npm run build' first.`,
    );
  }
}

async function validateENSOwnership(
  signer: ethers.Signer,
  ensNode: string,
  domain: string,
): Promise<void> {
  console.log(`🔍 Validating ownership of ${domain}...`);

  const ensRegistry = new ethers.Contract(
    ENS_REGISTRY_ADDRESS,
    ENS_REGISTRY_ABI,
    signer,
  );

  try {
    const owner = await ensRegistry.owner(ensNode);
    const signerAddress = await signer.getAddress();

    console.log(`📋 Domain: ${domain}`);
    console.log(`🏠 Current owner: ${owner}`);
    console.log(`👤 Signer address: ${signerAddress}`);

    if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
      throw new Error(`❌ You don't own ${domain}. Current owner: ${owner}`);
    }

    console.log("✅ Ownership validated");
  } catch (error) {
    console.error("❌ Failed to validate ownership:", error);
    throw error;
  }
}

async function updateContentHash(
  signer: ethers.Signer,
  ensNode: string,
  domain: string,
  ipfsHash: string,
): Promise<void> {
  console.log(`🔄 Updating content hash for ${domain}...`);

  const ensRegistry = new ethers.Contract(
    ENS_REGISTRY_ADDRESS,
    ENS_REGISTRY_ABI,
    signer,
  );

  try {
    // Get current resolver
    const resolverAddress = await ensRegistry.resolver(ensNode);
    console.log(`🔗 Current resolver: ${resolverAddress}`);

    if (resolverAddress === ethers.ZeroAddress) {
      console.log("⚠️  No resolver set, setting public resolver...");
      const setResolverTx = await ensRegistry.setResolver(
        ensNode,
        ENS_PUBLIC_RESOLVER_ADDRESS,
      );
      await setResolverTx.wait();
      console.log("✅ Public resolver set");
    }

    // Use the resolver (either existing or newly set)
    const finalResolver =
      resolverAddress === ethers.ZeroAddress
        ? ENS_PUBLIC_RESOLVER_ADDRESS
        : resolverAddress;
    const resolver = new ethers.Contract(
      finalResolver,
      ENS_RESOLVER_ABI,
      signer,
    );

    // Encode IPFS hash for ENS
    const encodedHash = encodeIPFSHash(ipfsHash);
    console.log(`📝 Encoded content hash: ${encodedHash}`);

    // Set content hash
    console.log("📤 Submitting transaction...");
    const tx = await resolver.setContenthash(ensNode, encodedHash);
    console.log(`🔗 Transaction hash: ${tx.hash}`);

    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();

    if (receipt?.status === 1) {
      console.log("✅ Content hash updated successfully!");
      console.log(
        `🌐 Your site should now be accessible at: https://commbank.eth`,
      );
      console.log(`📋 IPFS Hash: ${ipfsHash}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
    } else {
      throw new Error("Transaction failed");
    }
  } catch (error) {
    console.error("❌ Failed to update content hash:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Starting ENS deployment process...\n");

  const config: DeploymentConfig = {
    domain: "commbank.eth",
    ensNode: namehash("commbank.eth"),
  };

  try {
    // Get private key from environment
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("Missing PRIVATE_KEY environment variable");
    }

    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || "https://eth.llamarpc.com",
    );
    const signer = new ethers.Wallet(privateKey, provider);

    console.log(`🔑 Using account: ${await signer.getAddress()}`);
    console.log(
      `🌐 Network: ${(await provider.getNetwork()).name} (Chain ID: ${(await provider.getNetwork()).chainId})`,
    );

    // Get IPFS hash (from build script or parameter)
    const ipfsHash = process.argv[2] || (await getLatestIPFSHash());
    console.log(`📋 IPFS Hash: ${ipfsHash}\n`);

    // Validate ownership
    await validateENSOwnership(signer, config.ensNode, config.domain);

    // Update content hash
    await updateContentHash(signer, config.ensNode, config.domain, ipfsHash);

    console.log("\n🎉 Deployment completed successfully!");
    console.log(`✨ ${config.domain} now points to IPFS hash: ${ipfsHash}`);
    console.log("🔄 DNS propagation may take a few minutes...");
  } catch (error) {
    console.error("\n💥 Deployment failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main as deployToENS };
