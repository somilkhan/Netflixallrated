FROM node:20-slim AS builder
WORKDIR /app
ENV NODE_ENV=development

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
RUN npm install

COPY src ./src
RUN ./node_modules/.bin/prisma generate && ./node_modules/.bin/tsc

FROM node:20-slim
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000
CMD sh -c "NODE_ENV=production ./node_modules/.bin/prisma migrate deploy && NODE_ENV=production node dist/server.js"
