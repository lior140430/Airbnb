FROM node:18-alpine

WORKDIR /app

# Copy root and client package files
COPY package.json package.json
COPY apps/client/package.json apps/client/package.json

# Install dependencies
RUN npm install

# Copy all source code
COPY apps/client/ apps/client/

# Expose port 5173 (Vite dev server)
EXPOSE 5173

# Set environment variables for API communication within Docker
ENV VITE_AUTH_API_URL=http://auth-service:3000
ENV VITE_PROPERTY_API_URL=http://property-service:3001

# Start dev server with host binding (0.0.0.0) to be accessible from outside container
WORKDIR /app/apps/client
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
