# client Scripts

## Deploy to IPFS

This script builds the client application and uploads it to a local IPFS node.

### Prerequisites

- IPFS node running at `http://localhost:6969`
- Built dist directory (automatically created by `build-ipfs` command)

### Usage

From the project root:

```bash
bun run build-ipfs
```

Or from the client directory:

```bash
cd client
bun run build-ipfs    # Build and upload
bun run deploy-ipfs   # Upload only (requires existing build)
```

### What it does

1. Compiles TypeScript and builds the Vite application
2. Reads all files from the `dist/` directory
3. Uploads them to your local IPFS node at `localhost:6969`
4. Returns the IPFS hash (CID) of the uploaded content

### Output

The script will output:

- ✅ Upload successful!
- 📍 IPFS Hash: `QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- 🌐 Local Gateway URL: `http://localhost:6969/ipfs/QmXXX...`
- 🌐 Public Gateway URL: `https://ipfs.io/ipfs/QmXXX...`

### Configuration

To change the IPFS node URL, edit the `IPFS_API_URL` constant in `scripts/deploy-to-ipfs.ts`:

```typescript
const IPFS_API_URL = "http://localhost:6969";
```
