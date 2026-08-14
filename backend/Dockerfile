FROM node:20-slim

WORKDIR /app

# Prisma needs OpenSSL; Debian slim keeps this predictable (avoids musl/Alpine issues)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npm start"]

