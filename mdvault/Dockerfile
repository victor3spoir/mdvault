FROM oven/bun:1.3.14-alpine AS base

WORKDIR /app

FROM base AS dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production=false

FROM dependencies AS build
COPY . .
RUN bun run build

FROM base AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/.output ./.output

USER bun
EXPOSE 3000
CMD ["bun", ".output/server/index.mjs"]
