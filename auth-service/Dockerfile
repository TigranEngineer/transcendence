FROM node:20-alpine
WORKDIR /app
# Install OpenSSL
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
COPY . .
RUN npx prisma generate
EXPOSE 3001
# CMD ["sh", "-c", "npm install && npx prisma migrate dev --name init && npm run build && npm start"]
CMD ["sh", "-c", "npm install && npx prisma migrate dev --name init && npm run dev"]