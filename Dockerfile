FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Client dependencies (cached layer) ────────────────────────────────────────
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install

# ── Server dependencies (cached layer) ────────────────────────────────────────
COPY server/package.json server/package-lock.json* ./server/
COPY server/prisma ./server/prisma/
RUN cd server && npm install

# ── Build client ──────────────────────────────────────────────────────────────
COPY client ./client
RUN cd client && npm run build

# ── Build server ──────────────────────────────────────────────────────────────
COPY server ./server
RUN cd server && npx prisma generate && npm run build

EXPOSE 3000

CMD ["sh", "-c", "cd server && npx prisma generate && npx prisma migrate deploy && NODE_ENV=production node dist/server.js"]
