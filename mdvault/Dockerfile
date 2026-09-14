FROM oven/bun:1.4 AS base

WORKDIR /app

FROM base AS dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile 

FROM dependencies AS build
COPY . .
RUN bun run build

FROM base AS runtime
RUN apt-get update \
  && apt-get upgrade -y --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
  HOST=0.0.0.0 \
  PORT=3000

COPY --from=build /app/.output ./.output

USER bun
EXPOSE 3000
CMD ["bun", ".output/server/index.mjs"]
