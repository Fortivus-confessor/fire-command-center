FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Variáveis injetadas em build-time pelo docker-compose
ARG VITE_KEYCLOAK_URL
ARG VITE_API_PUBLIC_BASE

# Build SPA estática (sem Cloudflare Workers, sem SSR)
RUN bunx vite build --config vite.config.vps.ts

FROM nginx:alpine

COPY --from=builder /app/dist-vps /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
