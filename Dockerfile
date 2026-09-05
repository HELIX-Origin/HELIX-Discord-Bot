# ==============================================================================
# HELIX Discord Bot & Web Dashboard — Production Multi-Stage Dockerfile
# The HELIX bot is fully self-contained under HELIX/ (its own package.json).
# This build treats HELIX/ as the application root inside the container.
# ==============================================================================

# ─── Stage 1: Build & Dependencies ────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install build utilities (git and ca-certificates)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Copy the HELIX project (its own package.json drives npm ci + build)
COPY HELIX/ ./HELIX/

# Install all dependencies (including devDependencies for TypeScript)
WORKDIR /app/HELIX
RUN npm ci

# Compile TypeScript to standalone ESM distribution in src/dist/ (tsc)
RUN npm run build

# Prune devDependencies to keep only runtime dependencies for production
RUN npm prune --omit=dev

# ─── Stage 2: Production Runner ───────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner

WORKDIR /app

# Install runtime utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Set production environment variables
ENV NODE_ENV=production \
    PORT=5000 \
    DISCORD_DB_PATH=/app/data/helix-bot.sqlite

# Copy the compiled HELIX project from the builder
COPY --from=builder /app/HELIX ./HELIX

# Prepare persistent data storage for the zero-cost SQLite database
RUN mkdir -p /app/data && chmod 777 /app/data
VOLUME ["/app/data"]

# Expose the companion dashboard and OAuth2 callback port
EXPOSE 5000

# Health check endpoint on dashboard health probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 5000) + '/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Launch HELIX Discord Bot & Web Dashboard subsystem
CMD ["node", "HELIX/dist/index.js"]
