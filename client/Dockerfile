FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=development

COPY package*.json ./
RUN npm install

COPY . .
RUN ./node_modules/.bin/tsc && ./node_modules/.bin/vite build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist

EXPOSE 4173
CMD sh -c "serve -s dist -l ${PORT:-4173}"
