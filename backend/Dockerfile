FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files and prisma schema
COPY package.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN pnpm install

# Rebuild bcrypt for Alpine Linux
RUN pnpm rebuild bcrypt

# Generate Prisma client
RUN pnpm prisma generate

# Copy startup script
COPY start.sh ./start.sh

# Copy source code
COPY . .

# Build application

# Remove build dependencies to reduce image size (after build)
RUN pnpm build

# Remove build dependencies to reduce image size
RUN apk del python3 make g++

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Make script executable
RUN chmod +x ./start.sh

# Change ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

# Expose port
EXPOSE 3000

# Start application
CMD ["./start.sh"]
