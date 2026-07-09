FROM node:22-slim

ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY client/package.json ./client/
RUN cd client && yarn install --network-timeout 300000 --ignore-engines
COPY client ./client
RUN cd client && yarn build

COPY server/package.json ./server/
COPY server/prisma ./server/prisma/
RUN cd server && yarn install --network-timeout 300000 --ignore-engines
COPY server ./server
RUN cd server && npx prisma generate && yarn build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "cd server && npx prisma migrate deploy && node dist/server.js"]
