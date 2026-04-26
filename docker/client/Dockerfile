# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY apps/client/package.json apps/client/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/client/ .

# Build the application
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Install serve to run the application
RUN npm install -g serve

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5173', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the application
CMD ["serve", "-s", "dist", "-l", "5173"]
