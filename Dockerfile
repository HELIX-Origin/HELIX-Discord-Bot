# ==============================================================================
# HELIX Discord Bot & Web Dashboard — Production Multi-Stage Dockerfile
# ==============================================================================

# ─── Stage 1: Build & Dependencies ────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install native build dependencies required by better-sqlite3 and git
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    git \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Copy package manifests first for optimal layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for TypeScript and tsup)
RUN npm ci

# Copy source code and build configs
COPY tsconfig.json tsup.config.ts ./
COPY src/ ./src/
COPY bot/ ./bot/
COPY scripts/ ./scripts/

# Compile TypeScript to standalone dual ESM distribution in dist/
RUN npm run build

# Prune devDependencies to keep only runtime dependencies for production
RUN npm prune --omit=dev

# ─── Stage 2: Production Runner ───────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner

WORKDIR /app

# Install runtime utilities (git for optional CLI cloning via CLONE_CLI=true)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Set production environment variables
ENV NODE_ENV=production \
    PORT=5000 \
    DISCORD_DB_PATH=/app/data/helix-bot.sqlite

# Copy production dependencies and compiled artifacts from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/bot/icon.jpg ./bot/icon.jpg

# Prepare persistent data storage for the zero-cost SQLite database
RUN mkdir -p /app/data && chmod 777 /app/data
VOLUME ["/app/data"]

# Expose the companion dashboard and OAuth2 callback port
EXPOSE 5000

# Health check endpoint on dashboard health probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 5000) + '/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Initialize SQLite database and launch Discord Bot + Web Dashboard
CMD ["sh", "-c", "node scripts/setup.mjs && node dist/bot/index.js"]
