FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .

# Variaveis injetadas em build-time pelo docker-compose
ARG VITE_KEYCLOAK_URL

# Build SPA estatica (sem Cloudflare Workers, sem SSR)
RUN bunx vite build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
