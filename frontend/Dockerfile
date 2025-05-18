# Use an official Node.js runtime as the base image
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Build the React app
RUN npm run build

# Use a lightweight server to serve the built app
FROM node:20-alpine

# Install serve to serve the static files
RUN npm install -g serve

# Set working directory
WORKDIR /app

# Copy the build output from the previous stage
COPY --from=build /app/build ./build

# Expose the port the frontend runs on
EXPOSE 3001

# Serve the app
CMD ["serve", "-s", "build", "-l", "3001"]