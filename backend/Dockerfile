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

# Install production dependencies
RUN pnpm install --prod --ignore-scripts=false

# Generate Prisma client using pnpm dlx (downloads and runs specific version)
RUN pnpm dlx prisma@6.19.1 generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy start script and make it executable
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Verify dist was copied correctly
RUN ls -la dist/ || (echo "Copy failed - dist directory not found" && exit 1)
RUN test -f dist/src/main.js || (echo "Copy failed - dist/src/main.js not found" && exit 1)

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Create uploads directory with proper permissions before switching to non-root user
RUN mkdir -p /app/uploads/logos && chown -R nestjs:nodejs /app/uploads && chmod -R 755 /app/uploads

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Start application with migrations and seed (via start.sh)
CMD ["./start.sh"]
