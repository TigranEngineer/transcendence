# FROM node:20-alpine
# WORKDIR /app
# # Install OpenSSL
# RUN apk add --no-cache openssl
# RUN npx prisma generate migrate dev --name add-two-factor
# RUN npm install speakeasy qrcode
# # COPY package.json package-lock.json ./
# COPY . .
# RUN npm install
# RUN npx prisma generate
# EXPOSE 3001
# # CMD ["sh", "-c", "npm install && npx prisma migrate dev --name init && npm run build && npm start"]
# CMD ["sh", "-c", "npx prisma migrate dev --name init && npm run dev"]

FROM node:20-alpine

WORKDIR /app

# Install OpenSSL and Prisma CLI
RUN apk add --no-cache openssl
RUN npm install -g prisma

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install
RUN npm install speakeasy qrcode

# Copy all project files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3001

# Run migration and start server at runtime
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]