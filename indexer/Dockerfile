FROM node:22-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies at root
RUN pnpm install --frozen-lockfile

# Change to indexer directory
WORKDIR /app/indexer

# Run codegen
RUN pnpm run codegen

# Build
RUN pnpm run build

# Set environment
ENV NODE_ENV=production

# Start
CMD ["pnpm", "start"]
