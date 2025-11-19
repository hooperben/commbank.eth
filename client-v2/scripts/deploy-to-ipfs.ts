import fs from "fs";
import path from "path";
import FormData from "form-data";
import axios from "axios";

// TODO env-ise
const IPFS_API_URL = "http://localhost:5001";

interface IPFSAddResponse {
  Name: string;
  Hash: string;
  Size: string;
}

async function addDirectoryToIPFS(dirPath: string): Promise<string> {
  const form = new FormData();

  function addFilesRecursively(currentPath: string, basePath: string = "") {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const relativePath = basePath ? path.join(basePath, item) : item;
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        addFilesRecursively(fullPath, relativePath);
      } else {
        const fileStream = fs.createReadStream(fullPath);
        form.append("file", fileStream, {
          filepath: relativePath,
        });
      }
    }
  }

  console.log(`📁 Reading files from: ${dirPath}`);
  addFilesRecursively(dirPath);

  console.log("☁️  Uploading to IPFS...");

  try {
    const response = await axios.post<IPFSAddResponse>(
      `${IPFS_API_URL}/api/v0/add?recursive=true&wrap-with-directory=true`,
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      },
    );

    // The response is newline-delimited JSON, get the last line which is the directory
    const lines = response.data
      .toString()
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    const lastLine = lines[lines.length - 1];
    const result = JSON.parse(lastLine) as IPFSAddResponse;

    return result.Hash;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("IPFS API Error:", error.message);
      if (error.response) {
        console.error("Response:", error.response.data);
      }
    }
    throw error;
  }
}

async function main() {
  try {
    console.log("🚀 Starting client-v2 deployment to IPFS...");

    const distDir = path.join(process.cwd(), "dist");

    if (!fs.existsSync(distDir)) {
      throw new Error(
        `Build directory ${distDir} does not exist. Run 'bun run build' first.`,
      );
    }

    const hash = await addDirectoryToIPFS(distDir);

    console.log("✅ Upload successful!");
    console.log(`📍 IPFS Hash: ${hash}`);
    console.log(`🌐 Local Gateway URL: http://localhost:6969/ipfs/${hash}`);
    console.log(`🌐 Public Gateway URL: https://ipfs.io/ipfs/${hash}`);

    return hash;
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
