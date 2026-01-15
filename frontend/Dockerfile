# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Build arguments
ARG VITE_API_URL

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL

# Copy package files
COPY package.json ./

# Install dependencies (without frozen lockfile since we don't have one)
RUN pnpm install

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM nginx:alpine AS production

# Copy nginx config template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Default port
ENV PORT=80

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/ || exit 1

# nginx:alpine image automatically runs envsubst on /etc/nginx/templates/*.template
# and outputs to /etc/nginx/conf.d/ before starting
CMD ["nginx", "-g", "daemon off;"]
