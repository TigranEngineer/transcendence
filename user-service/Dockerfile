FROM node:20-alpine
WORKDIR /app
# Install OpenSSL
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npx prisma migrate deploy
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]