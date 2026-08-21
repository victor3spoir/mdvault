---
title: Deploy
description: Run MDVault in production with the container image, behind a proxy.
order: 20
---

MDVault is a single stateless container. There is no database to provision and
no volume to back up — the state is your GitHub repository.

## The image

```
ghcr.io/victor3spoir/mdvault:latest
```

It listens on port 3000 inside the container.

## Compose

```yaml
name: mdvault

services:
  mdvault:
    image: ghcr.io/victor3spoir/mdvault:latest
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          cpus: "0.5"
          memory: "600MiB"
        limits:
          cpus: "0.7"
          memory: "800MiB"
    ports:
      - "127.0.0.1:33000:3000"
    environment:
      GITHUB_TOKEN: ${GITHUB_TOKEN}
      GITHUB_OWNER: ${GITHUB_OWNER}
      GITHUB_REPO: ${GITHUB_REPO}
      SERVER_URL: ${SERVER_URL}
      TRUSTED_PROXY: "true"
```

Two details matter more than the rest.

**The port is bound to loopback.** `127.0.0.1:33000:3000` means the container is
unreachable from outside the host. MDVault has no login, so this is the default
for a reason — read [Security model](/architecture/security) before changing it.

**Memory is capped at 800 MiB.** Image resizing uses `sharp`, which is happy to
use whatever it is given. The limit keeps a large upload from starving the host.

## Behind a reverse proxy

Put an authenticating proxy in front and forward to `127.0.0.1:33000`. With
Caddy:

```
mdvault.example.com {
  basic_auth {
    you $2a$14$...
  }
  reverse_proxy 127.0.0.1:33000
}
```

Then set `SERVER_URL=https://mdvault.example.com` so write requests validate
their origin correctly, and `TRUSTED_PROXY=true` so rate limiting sees the real
client rather than the proxy.

Set `TRUSTED_PROXY=true` **only** when a proxy you control sets
`X-Forwarded-For`. Exposed directly, it lets a client spoof its identity.

## Health check

```yaml
healthcheck:
  test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3000/api/ping"]
  interval: 30s
  timeout: 3s
  retries: 3
```

It confirms the server answers. It does not confirm the token is valid — for
that, load the dashboard.

## Upgrading

```bash
docker compose pull
docker compose up -d
```

Nothing is lost. The container holds no state; content and configuration are in
the repository.

## Rotating the token

Update the environment and restart. Every read and write fails loudly while the
token is invalid, so a botched rotation is obvious rather than silent.

## Deploying the documentation site

This documentation is a separate project in `docs-site/`, deployable on its own.
See [Write the docs](/guides/write-the-docs).
