FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- client: install (with devDeps, so vite is present) then build ---
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install
COPY client ./client
RUN cd client && npm run build

# --- server: install, generate prisma client, then build ---
COPY server/package.json server/package-lock.json* ./server/
COPY server/prisma ./server/prisma/
RUN cd server && npm install
COPY server ./server
RUN cd server && npx prisma generate && npm run build

# only switch to production mode AFTER installs/builds are done
ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "cd server && npx prisma migrate deploy && node dist/server.js"]
