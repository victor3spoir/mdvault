FROM oven/bun:1.3.5-alpine AS base
FROM base AS builder
WORKDIR /usr/app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ENV NODE_OPTIONS='--max-old-space-size=4096'
# Dummy env vars for build-time (Next.js prerendering)
# ENV GITHUB_TOKEN=placeholder \
#     GITHUB_OWNER=placeholder \
#     GITHUB_REPO=placeholder
RUN --mount=type=secret,id=github_token \
  --mount=type=secret,id=github_owner \
  --mount=type=secret,id=github_repo \
  export GITHUB_TOKEN="$(cat /run/secrets/github_token)" \
  export GITHUB_OWNER="$(cat /run/secrets/github_owner)" \
  export GITHUB_REPO="$(cat /run/secrets/github_repo)" \
  bun run build


FROM base AS prod
WORKDIR /usr/app

COPY --from=builder /usr/app/public ./public
COPY --from=builder --chown=bun:bun /usr/app/.next/standalone ./
COPY --from=builder --chown=bun:bun /usr/app/.next/static ./.next/static

USER bun

EXPOSE 3000
ENV NODE_ENV=production \
  HOSTNAME="0.0.0.0" \
  PORT=3000 \
  GITHUB_TOKEN= \
  GITHUB_OWNER= \
  GITHUB_REPO=
ENTRYPOINT [ "bun" ]
CMD ["server.js"]