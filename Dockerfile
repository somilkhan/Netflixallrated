FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

RUN npm install -g npm@latest

WORKDIR /app

COPY . .

RUN cd client && npm install && npm run build

RUN cd server && npm install && npx prisma generate && npm run build

EXPOSE 3000

CMD ["sh", "-c", "cd server && npx prisma migrate deploy && NODE_ENV=production node dist/server.js"]
