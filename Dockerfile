FROM node:20-slim

RUN npm install -g npm@10.9.2

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm config set fund false && npm config set audit false && \
    (npm install --include=dev || (sleep 5 && npm install --include=dev) || (sleep 10 && npm install --include=dev))
COPY client ./client
RUN cd client && npm run build

COPY server/package.json server/package-lock.json* ./server/
COPY server/prisma ./server/prisma/
RUN cd server && npm config set fund false && npm config set audit false && \
    (npm install || (sleep 5 && npm install) || (sleep 10 && npm install))
COPY server ./server
RUN cd server && npx prisma generate && npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "cd server && npx prisma migrate deploy && node dist/server.js"]
