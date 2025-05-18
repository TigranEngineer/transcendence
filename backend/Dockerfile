# Use an official Node.js runtime as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Generate Prisma client for SQLite
RUN npx prisma init

# Copy the rest of the backend code
COPY . .

# Generate Prisma client for SQLite
RUN npx prisma generate

# # Apply Prisma migrations (create the SQLite database if it doesn't exist)
# RUN npx prisma migrate deploy

# Build TypeScript code
RUN npm run build

# Expose the port the backend runs on
EXPOSE 3000

# Start the backend
CMD ["npm", "start"]