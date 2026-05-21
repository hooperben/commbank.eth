# Image used by all three services in docker-compose.stress.yml:
# hardhat-node (runs `hardhat node`), deployer (one-shot deploy), and the
# stress harness itself. Same image, different commands.
#
# Build prerequisites on the host BEFORE `docker compose build`:
#   - circuits compiled: each circuits/*/target/*.json must exist
#   - contracts/artifacts/ populated (from `npx hardhat compile`)
# We don't run nargo inside the container; the circuit toolchain is heavy
# and circuits/*/target/ already lives outside source control on the host.

FROM node:22-alpine

RUN apk add --no-cache bash python3 make g++ git
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy lockfile + workspace skeleton first so the layer with `pnpm install`
# stays cached when only source changes.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY contracts/package.json ./contracts/
COPY shared/package.json ./shared/
COPY stress/package.json ./stress/
COPY indexer/package.json ./indexer/
COPY indexer/generated/package.json ./indexer/generated/
COPY client/package.json ./client/
COPY relayer/package.json ./relayer/

RUN pnpm install --frozen-lockfile --ignore-scripts || pnpm install --ignore-scripts

# Now copy real source. We don't bind-mount because dev-style mounts trip
# over the linux-vs-darwin native deps on M-series macs.
COPY contracts ./contracts
COPY circuits ./circuits
COPY shared ./shared
COPY stress ./stress

# Sanity check at build time so a missing artifact fails the image build,
# not at first tx submission.
RUN test -f /app/circuits/deposit/target/deposit.json \
  || (echo "Missing circuits/deposit/target/deposit.json — run circuit compile on host first" && exit 1)
RUN test -f /app/contracts/artifacts/contracts/CommBankDotEth.sol/CommBankDotEth.json \
  || (echo "Missing contracts/artifacts — run \`cd contracts && npx hardhat compile\` on host first" && exit 1)

WORKDIR /app/stress

CMD ["pnpm", "run", "harness:run"]
