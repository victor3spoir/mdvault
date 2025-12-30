FROM oven/bun:1.3.5-alpine AS base
FROM base AS builder
WORKDIR /usr/app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json .
RUN bun install
COPY . .
ENV NODE_OPTIONS='--max-old-space-size=4096'
RUN bun run build


FROM base AS prod
WORKDIR /usr/app

COPY --from=builder /usr/app/public ./public
COPY --from=builder --chown=bun:bun /usr/app/.next/standalone ./
COPY --from=builder --chown=bun:bun /usr/app/.next/static ./.next/static

USER bun

EXPOSE 3000
ENV NODE_ENV=production \
  HOSTNAME="0.0.0.0" \
  PORT=3000

CMD ["bun", "server.js"]