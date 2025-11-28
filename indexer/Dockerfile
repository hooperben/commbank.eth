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

# Build generated code
WORKDIR /app/indexer/generated
RUN pnpm run build

# Build indexer
WORKDIR /app/indexer
RUN pnpm run build

# Set environment
ENV NODE_ENV=production

# Set Railway internal service URLs (will be overridden by Railway variables if set)
ENV DATABASE_URL=postgresql://postgres:postgres@postgres.railway.internal:5432/postgres
ENV HASURA_GRAPHQL_ENDPOINT=http://hasura.railway.internal:8080/v1/graphql

# Expose Hasura port (if needed)
EXPOSE 8080

# Start
CMD ["pnpm", "start"]
