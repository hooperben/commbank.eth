# Use official Node.js image as base
FROM node:20-alpine AS base
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.16.1 --activate

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Run the application
CMD ["node", "dist/index.js"]
