# Build stage for commbank.eth indexer
FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy root workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all workspace packages for dependency resolution
COPY shared/package.json ./shared/
COPY contracts/package.json ./contracts/
COPY indexer/package.json ./indexer/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY shared ./shared
COPY contracts ./contracts
COPY indexer ./indexer

# Generate indexer code
WORKDIR /app/indexer
RUN pnpm run codegen

# Install generated dependencies and build
WORKDIR /app/indexer/generated
RUN pnpm install --frozen-lockfile

WORKDIR /app/indexer
RUN pnpm run build

# Production stage
FROM node:22-alpine AS production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files for workspaces
COPY shared/package.json ./shared/
COPY contracts/package.json ./contracts/
COPY indexer/package.json ./indexer/

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built code from build stage
COPY --from=base /app/indexer/generated ./indexer/generated
COPY --from=base /app/indexer/dist ./indexer/dist
COPY --from=base /app/indexer/src ./indexer/src
COPY --from=base /app/shared ./shared
COPY --from=base /app/contracts ./contracts

WORKDIR /app/indexer

# Set environment
ENV NODE_ENV=production

# Run the indexer
CMD ["pnpm", "start"]
