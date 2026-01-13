# CommBank.eth Relayer

Transaction relayer and RPC proxy for CommBank.eth, providing private transaction relay and secure RPC endpoint access with CORS protection.

## Features

- **Transaction Relay**: Allows for submitting of transactions for a gasless UX
- **RPC Proxy**: Hide RPC credentials and enforce CORS policy

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your RPC URLs and allowed origins

# Run in development mode (with hot reload)
pnpm run dev

# Or build and run in production mode
pnpm run build
pnpm run start
```

### Docker Deployment

```bash
# Build the image
docker build -t commbank-eth-relayer .

# Run the container
docker run -d \
  --name commbank-eth-relayer \
  -p 3000:3000 \
  --env-file .env \
  commbank-eth-relayer

# View logs
docker logs -f commbank-eth-relayer

# Stop the container
docker stop commbank-eth-relayer
```

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS=https://commbank.eth.limo,http://localhost:3000,http://localhost:5173

# RPC Endpoints
RPC_ETH_MAINNET=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
RPC_ETH_SEPOLIA=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Optional: Enable RPC request logging
LOG_RPC_REQUESTS=false
```

### Supported Chain IDs

| Chain ID | Network          | Environment Variable |
| -------- | ---------------- | -------------------- |
| 1        | Ethereum Mainnet | `RPC_ETH_MAINNET`    |
| 11155111 | Ethereum Sepolia | `RPC_ETH_SEPOLIA`    |

## API Endpoints

### Health Check

```bash
GET /health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2024-01-12T10:30:00.000Z"
}
```

### RPC Proxy

```bash
POST /rpc/:chainId
```

Forward JSON-RPC requests to the configured RPC endpoint for the specified chain.

**Example: Get latest block on Ethereum Mainnet**

```bash
curl -X POST http://localhost:3000/rpc/1 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_blockNumber",
    "params": [],
    "id": 1
  }'
```

### Transaction Relay

```bash
POST /tx
```

Submit a zero-knowledge proof transaction for relay.

**Request Body:**

```json
{
  "proof": {
    "proof": "0x...",
    "publicInputs": ["0x...", "0x..."]
  },
  "payload": ["0x..."]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Transaction received and queued for processing",
  "txId": "tx_1234567890_abc123"
}
```

## CORS Security

The relayer enforces CORS to prevent unauthorized access to your RPC endpoints.

**Configuration:**

Set allowed origins in `.env`:

```bash
ALLOWED_ORIGINS=https://commbank.eth.limo,https://app.example.com
```

**Behavior:**

- Requests from allowed origins are permitted
- Requests with no origin (curl, mobile apps) are allowed
- Requests from unauthorized origins are blocked with CORS error

**Testing CORS:**

```bash
# Allowed origin - will succeed
curl -X POST http://localhost:3000/rpc/1 \
  -H "Origin: https://commbank.eth.limo" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Unauthorized origin - will fail
curl -X POST http://localhost:3000/rpc/1 \
  -H "Origin: https://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```
