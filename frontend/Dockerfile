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

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
