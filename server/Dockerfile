FROM node:20-slim AS builder
WORKDIR /app
ENV NODE_ENV=development

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
RUN npm ci

COPY src ./src
RUN npx prisma generate && npm run build

FROM node:20-slim
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000
CMD sh -c "NODE_ENV=production npx prisma migrate deploy && NODE_ENV=production node dist/server.js"
