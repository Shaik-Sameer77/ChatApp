# 1. Use official Node.js LTS version
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files first for layer caching
COPY package*.json ./

# 4. Install only production dependencies
RUN npm install --production

# 5. Copy rest of the application code
COPY . .

# 6. Expose port (adjust if your backend runs on a different port)
EXPOSE 8000

# 7. Start the server
CMD ["node", "index.js"]
