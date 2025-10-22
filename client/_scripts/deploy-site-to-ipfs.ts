import { PinataSDK } from "pinata";
import fs from "fs";
import path from "path";

async function getAllFilesFromDirectory(
  dirPath: string,
  basePath: string = "",
): Promise<File[]> {
  const files: File[] = [];
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const relativePath = basePath ? path.join(basePath, item) : item;

    if (fs.statSync(fullPath).isDirectory()) {
      // Recursively get files from subdirectories
      const subDirFiles = await getAllFilesFromDirectory(
        fullPath,
        relativePath,
      );
      files.push(...subDirFiles);
    } else {
      // Read file content and create File object
      const fileContent = fs.readFileSync(fullPath);
      const mimeType = getMimeType(item);

      const file = new File([fileContent], relativePath, {
        type: mimeType,
      });

      files.push(file);
    }
  }

  return files;
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".eot": "application/vnd.ms-fontobject",
    ".xml": "application/xml",
    ".webp": "image/webp",
    ".webm": "video/webm",
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
  };

  return mimeTypes[ext] || "application/octet-stream";
}

async function main() {
  const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT!,
    pinataGateway:
      process.env.PINATA_API_GATEWAY || "example-gateway.mypinata.cloud",
  });

  try {
    console.log("🚀 Starting CommBank.eth deployment to IPFS...");

    // Test authentication
    await pinata.testAuthentication();
    console.log("✅ Pinata authentication successful");

    // Get all files from the out directory
    const outDir = path.join(process.cwd(), "out");

    if (!fs.existsSync(outDir)) {
      throw new Error(
        `Build directory ${outDir} does not exist. Run 'bun run build' first.`,
      );
    }

    console.log(`📁 Reading files from: ${outDir}`);
    const files = await getAllFilesFromDirectory(outDir);
    console.log(`📦 Found ${files.length} files to upload`);

    // Upload to IPFS
    console.log("☁️ Uploading to IPFS...");
    const upload = await pinata.upload.public.fileArray(files, {
      metadata: {
        keyvalues: {
          project: "commbank.eth",
          type: "static-site",
          buildDate: new Date().toISOString(),
        },
      },
    });

    console.log("✅ Upload successful!");
    console.log(`📍 IPFS Hash: ${upload.cid}`);
    console.log(
      `🌐 Gateway URL: https://${process.env.PINATA_API_GATEWAY}/ipfs/${upload.cid}`,
    );

    return upload;
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main().then().catch();
