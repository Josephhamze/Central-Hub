FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files and prisma schema
COPY package.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN pnpm install

# Generate Prisma client
RUN pnpm prisma generate

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Change ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main.js"]
