FROM node:22-slim

ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# node:22-slim ships with npm 10.9.8 ("Exit handler never called" bug).
# npm 12.x breaks npx ("Class extends undefined"). Pin to npm 10.8.x which is stable.
RUN npm install -g npm@10.8.0

WORKDIR /app

# ── Client build ──────────────────────────────────────────────────────────
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm install --prefer-offline=false

# Declare build-time env vars that Vite bakes into the bundle
ARG VITE_TMDB_API_KEY
ENV VITE_TMDB_API_KEY=$VITE_TMDB_API_KEY

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY client ./client
RUN cd client && npm run build

# ── Server setup ──────────────────────────────────────────────────────────
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm install --prefer-offline=false

COPY server ./server

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "cd server && NODE_ENV=production tsx server/server.ts"]
