FROM node:20-alpine

WORKDIR /app

# Configure npm for network resilience & retries
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Ensure entrypoint script has Unix LF line endings and is executable
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
