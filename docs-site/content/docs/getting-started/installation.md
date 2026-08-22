---
title: Installation
description: Run MDVault from the published container image in under five minutes.
order: 10
---

MDVault ships as a container image on GitHub Container Registry. You need two
things before starting: a GitHub repository that will hold your content, and a
token that can write to it — see [GitHub token](/docs/getting-started/github-token).

## Run it with Docker

```bash
docker run -d \
  --name mdvault \
  -p 127.0.0.1:3000:3000 \
  -e GITHUB_TOKEN=your_token \
  -e GITHUB_OWNER=your_username \
  -e GITHUB_REPO=your_repo \
  --restart unless-stopped \
  ghcr.io/victor3spoir/mdvault:latest
```

The `127.0.0.1:` prefix is deliberate. MDVault has **no login of its own** and
runs with a token that can write to your repository, so binding it to loopback
means only your machine can reach it. See
[Security model](/docs/architecture/security) before exposing it any further.

## Or with Compose

```yaml
name: mdvault

services:
  mdvault:
    image: ghcr.io/victor3spoir/mdvault:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      GITHUB_TOKEN: ${GITHUB_TOKEN}
      GITHUB_OWNER: ${GITHUB_OWNER}
      GITHUB_REPO: ${GITHUB_REPO}
```

```bash
docker compose up -d
```

`GITHUB_REPO` is the bare repository name — `my-content`, not
`github.com/user/my-content`.

## First run

Open **http://127.0.0.1:3000**. The dashboard lists one section per content
type it finds, and the sidebar links to Articles, Posts and Media straight away.

![The dashboard on first run, one card per content type and a log of recent commits](/screenshots/dashboard.png)

MDVault does not create anything until you save something. The first article you
write creates `articles/` in the repository; the first image you upload creates
`media/`. Custom types are declared in **Settings → Asset types** and create
their folder under `vault/` on first save.

If the app starts but every list is empty and the dashboard shows an error, the
token is usually the cause: it must have **Contents: read and write** on that
exact repository.

## Running from source

If you would rather build it yourself, see [Develop](/docs/guides/develop).
