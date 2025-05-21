FROM node:20-alpine
WORKDIR /app
# Install OpenSSL
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
COPY . .
RUN npm install
RUN npx prisma generate
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate dev --name init && npm run dev"]