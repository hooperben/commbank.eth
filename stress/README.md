# Stress harness

Hammers the local chain with concurrent `depositNative` calls from 10 worker
accounts. Pre-generates a pool of valid deposit proofs at startup and replays
them as fast as the node accepts them — proof generation is not the
bottleneck once warm.

Catches:
- **Rollover bugs** — when the active epoch fills, `EpochRolledOver` fires and
  the next leaf lands at `(epoch+1, index 0)`. Workers log when they observe
  rollover.
- **Concurrency bugs** — many in-flight deposits from different accounts.
  Each worker asserts no two of *its own* inserts share a leafIndex within
  the same epoch.
- **Root invariant** — after every successful deposit the worker reads
  `currentRoot()` and asserts it lives in `knownRoots`.
- **Leaf value invariant** — emitted `LeafInserted.leafValue` must match the
  noteHash the proof was generated against.

## Prerequisites (host)

Run once after any contract or circuit change:

```bash
# Circuits must be compiled — produces circuits/*/target/*.json
cd circuits/deposit && nargo build
cd ../transfer && nargo build
cd ../withdraw && nargo build
cd ../transfer_external && nargo build

# Contracts must be compiled — produces contracts/artifacts/**
cd contracts && npx hardhat compile
```

## Docker (detached, persistent)

```bash
# From repo root
docker compose -f docker-compose.stress.yml up --build -d

# Follow harness logs
docker compose -f docker-compose.stress.yml logs -f stress

# Errors only (requires jq)
docker compose -f docker-compose.stress.yml logs -f stress \
  | jq 'select(.level=="error")'

# Stop everything
docker compose -f docker-compose.stress.yml down
```

The three services share one image:

| Service        | Role                                                |
|----------------|-----------------------------------------------------|
| `hardhat-node` | JSON-RPC node on 8545, hardhat default mnemonic     |
| `deployer`     | One-shot: deploys protocol, writes deployment.json   |
| `stress`       | 10 workers in one process, JSON-per-line to stdout  |

A docker volume `shared` carries `deployment.json` between deployer and
stress.

## Running outside Docker (faster iteration)

```bash
# Terminal 1
cd contracts && npx hardhat node --hostname 127.0.0.1 --port 18545

# Terminal 2
cd stress
RPC_URL=http://127.0.0.1:18545 \
DEPLOYMENT_PATH=/tmp/stress-deployment.json \
WORKER_COUNT=10 \
pnpm run harness:deploy

# Terminal 3
RPC_URL=http://127.0.0.1:18545 \
DEPLOYMENT_PATH=/tmp/stress-deployment.json \
WORKER_COUNT=10 \
pnpm run harness:run
```

## Log format

Every output line is a JSON object. Fields always present:

| Field    | Meaning                                       |
|----------|-----------------------------------------------|
| `ts`     | ISO-8601 timestamp                            |
| `level`  | `info`, `warn`, or `error`                    |
| `source` | `worker-N`, `deploy`, `main`, `proof-pool`    |
| `msg`    | short human-readable description              |

Worker-specific fields on a successful deposit: `epoch`, `leafIndex`,
`latency_ms`, `tx`. Rollover observations include `oldEpoch`, `finalRoot`.

## Tunables (env vars)

| Var               | Default                  | Effect                                   |
|-------------------|--------------------------|------------------------------------------|
| `RPC_URL`         | `http://hardhat-node:8545` | Node URL                                 |
| `WORKER_COUNT`    | `10`                     | Parallel workers                          |
| `POOL_SIZE`       | `64`                     | Pre-generated proof queue depth          |
| `DEPLOYMENT_PATH` | `/shared/deployment.json` | Where deployer writes / workers read     |
| `WAIT_RPC_MAX_MS` | `60000`                  | Max wait for hardhat-node to come online |

## Known limitations (TODO)

- **Indexer not wired in yet.** Harness currently asserts against on-chain
  state directly; cross-checking the indexer's reconstructed tree is a
  follow-up. The indexer code itself was updated on this branch to read the
  new `epoch` field in `LeafInserted` and handle `EpochRolledOver`, but the
  docker-compose stack doesn't run the indexer.
- **Deposits only.** No transfer / withdraw flow yet — those need merkle
  paths and live proofs. Useful for the rollover-and-concurrency goals;
  insufficient for cross-epoch-spend goal.
- **No reorg simulation.** Hardhat node doesn't reorg.
