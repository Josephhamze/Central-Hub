# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json ./
COPY prisma ./prisma/

# Install build tools for native modules (bcrypt needs python, make, g++)
RUN apk add --no-cache python3 make g++

# Install dependencies
RUN pnpm install

# Generate Prisma client
RUN pnpm exec prisma generate

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Verify build output
RUN ls -la dist/ || (echo "Build failed - dist directory not found" && exit 1)
RUN test -f dist/src/main.js || (echo "Build failed - dist/src/main.js not found. Dist structure:" && find dist -type f -name "*.js" | head -20 && exit 1)

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install build tools for native modules (bcrypt needs python, make, g++)
RUN apk add --no-cache python3 make g++

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json ./
COPY prisma ./prisma/

# Install production dependencies (build scripts will run automatically)
# Then reinstall bcrypt separately to ensure it builds correctly
RUN pnpm install --prod --ignore-scripts=false && \
    echo "Reinstalling bcrypt@5.1.1 to ensure native bindings are built..." && \
    pnpm remove bcrypt && \
    pnpm add bcrypt@5.1.1 --save-prod --ignore-scripts=false && \
    echo "Verifying bcrypt installation..." && \
    BCrypt_BINDING=$(find /app/node_modules/.pnpm -name "bcrypt_lib.node" -type f 2>/dev/null | head -1) && \
    if [ -n "$BCrypt_BINDING" ]; then \
      echo "✓ bcrypt native bindings found at: $BCrypt_BINDING"; \
      ls -la "$BCrypt_BINDING"; \
    else \
      echo "✗ WARNING: bcrypt native bindings not found after install"; \
      echo "Attempting manual rebuild..."; \
      BCrypt_DIR=$(find /app/node_modules/.pnpm -type d -path "*/bcrypt@*/node_modules/bcrypt" 2>/dev/null | head -1) && \
      if [ -n "$BCrypt_DIR" ]; then \
        cd "$BCrypt_DIR" && \
        npm rebuild 2>&1 || node-gyp rebuild 2>&1 || true; \
      fi && \
      BCrypt_BINDING=$(find /app/node_modules/.pnpm -name "bcrypt_lib.node" -type f 2>/dev/null | head -1) && \
      if [ -z "$BCrypt_BINDING" ]; then \
        echo "✗ ERROR: bcrypt native bindings still missing"; \
        exit 1; \
      else \
        echo "✓ bcrypt native bindings found after rebuild at: $BCrypt_BINDING"; \
      fi; \
    fi

# Generate Prisma client using pnpm dlx (downloads and runs specific version)
RUN pnpm dlx prisma@6.19.1 generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy start script
COPY start.sh ./start.sh

# Verify dist was copied correctly
RUN ls -la dist/ || (echo "Copy failed - dist directory not found" && exit 1)
RUN test -f dist/src/main.js || (echo "Copy failed - dist/src/main.js not found" && exit 1)

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Start application with migrations and seed (via start.sh)
CMD ["./start.sh"]
