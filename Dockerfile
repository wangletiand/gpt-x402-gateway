FROM node:22-alpine

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev 2>/dev/null || npm install

# Copy application files
COPY . .

# Set default environment variables
ENV NODE_ENV=production
ENV GATEWAY_URL=https://gpt.558686.xyz

# Run MCP stdio bridge as the container entrypoint
ENTRYPOINT ["node", "client.mjs", "stdio"]
