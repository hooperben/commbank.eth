# Use official Node.js image as base
FROM node:20-alpine AS base
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.16.1 --activate

# Install dependencies - copy workspace files from monorepo root
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY relayer/package.json ./relayer/
COPY shared/package.json ./shared/
RUN pnpm install --filter relayer --filter shared

# Build the application
FROM base AS builder
# Install esbuild globally for bundling
RUN npm install -g esbuild
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/relayer/node_modules ./relayer/node_modules
COPY relayer ./relayer
COPY shared ./shared
WORKDIR /app/relayer
# Bundle to handle ESM module resolution (externalize npm packages, bundle local shared)
RUN esbuild src/index.ts --bundle --platform=node --target=node20 --outfile=dist/index.js \
    --external:cors --external:express --external:ethers --external:dotenv

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy workspace files for production install
COPY --from=deps /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=deps /app/relayer/package.json ./relayer/
COPY --from=deps /app/shared/package.json ./shared/

# Install production dependencies only
RUN pnpm install --filter relayer --filter shared --prod --frozen-lockfile

# Copy built application and shared package
COPY --from=builder /app/relayer/dist ./relayer/dist
COPY --from=builder /app/shared ./shared

WORKDIR /app/relayer

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Run the application
CMD ["node", "./dist/index.js"]
