FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .

# Usamos o host 0.0.0.0 para expor a porta fora do container
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]
