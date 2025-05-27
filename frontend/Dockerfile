# Stage 1: Build the React app
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Clear npm cache to avoid "idealTree" error and install dependencies
RUN npm cache clean --force && npm install

RUN npm install react-qr-code

# Install @babylonjs/core explicitly
RUN npm install @babylonjs/core

# Copy the rest of the frontend code
COPY . .

# Build the React app
RUN npm run build

# Stage 2: Serve the built app
FROM node:20-alpine

# Install serve to serve the static files
RUN npm install -g serve

# Set working directory
WORKDIR /app

# Copy the build output from the previous stage
COPY --from=build /app/build ./build

# Expose the port the frontend runs on
EXPOSE 3003

# Serve the app
CMD ["serve", "-s", "build", "-l", "3003"]