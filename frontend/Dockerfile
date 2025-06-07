FROM node:22-slim AS build

# Set working directory
WORKDIR /app

# Copy package files - Fix: Add trailing slash for multiple files
COPY package*.json ./

# Clear npm cache and install with more memory and better error handling
RUN npm cache clean --force && \
    npm install --verbose --no-audit --no-fund --maxsockets=1 || \
    (echo "First install failed, trying with legacy peer deps..." && \
     npm install --legacy-peer-deps --verbose --no-audit --no-fund --maxsockets=1) || \
    (echo "Second install failed, trying with force..." && \
     npm install --force --verbose --no-audit --no-fund --maxsockets=1)

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22-slim AS production

WORKDIR /app

# Copy package files for production dependencies - Fix: Add trailing slash
COPY package*.json ./

# Install only production dependencies
RUN npm cache clean --force && \
    npm ci --only=production --verbose --no-audit --no-fund --maxsockets=1

# Copy built application from build stage
COPY --from=build /app/dist ./dist/

# Handle public directory - create it first, then copy if exists
RUN mkdir -p ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3300

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3300/ || exit 1

# Start the application
CMD ["npm", "start"]