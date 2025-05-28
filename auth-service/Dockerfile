# FROM node:20-alpine
# WORKDIR /app
# # Install OpenSSL
# RUN apk add --no-cache openssl
# # COPY package.json package-lock.json ./
# COPY . .
# RUN npm install
# RUN npx prisma generate
# EXPOSE 3001
# # CMD ["sh", "-c", "npm install && npx prisma migrate dev --name init && npm run build && npm start"]
# CMD ["sh", "-c", "npx prisma migrate dev --name init && npm run dev"]



FROM node:20-alpine

WORKDIR /app

# Install OpenSSL
RUN apk add --no-cache openssl

# Copy package.json and package-lock.json for dependency installation
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the TypeScript code for production
RUN npm run build

# Expose port 3001
EXPOSE 3001

# Run migrations and start the application
# For production, use compiled code; for development, use commented alternative
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
# Development alternative (uncomment for dev mode):
# CMD ["sh", "-c", "npx prisma migrate dev --name init && npm run dev"]