FROM node:20-alpine

WORKDIR /app

# Install OpenSSL
RUN apk add --no-cache openssl

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the TypeScript code
RUN npm run build

# Expose port 3001
EXPOSE 3001

# Run migrations and start the application
# CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
# Development alternative:
CMD ["sh", "-c", "npx prisma migrate dev --name init && npm run dev"]