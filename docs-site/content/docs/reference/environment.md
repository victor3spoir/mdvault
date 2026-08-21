---
title: Environment
description: Every variable MDVault reads, what it defaults to, and what breaks without it.
order: 10
---

## GitHub

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `GITHUB_TOKEN` | Yes | — | Token used for every read and write |
| `GITHUB_OWNER` | Yes | — | User or organization owning the repository |
| `GITHUB_REPO` | Yes | — | Repository name only, no owner, no URL |
| `ARTICLES_PATH` | No | `articles` | Folder holding articles |
| `POSTS_PATH` | No | `posts` | Folder holding posts |
| `MEDIA_PATH` | No | `media` | Folder holding images |

A missing required variable throws at first use and names **every** absent
variable, not just the first — so one restart tells you the whole story instead
of three.

Changing a `*_PATH` after content exists moves nothing. The app reads the new
folder; the old content stays in Git and disappears from the interface. Move
the files in a commit, then restart.

Token creation is covered in [GitHub token](/getting-started/github-token).

## Server and security

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `SERVER_URL` | No | — | Public origin of the deployment, used to validate write requests |
| `TRUSTED_PROXY` | No | unset | Set to `true` only when a reverse proxy you control sets `X-Forwarded-For` |

`TRUSTED_PROXY` decides whether `X-Forwarded-For` is believed for rate
limiting. Behind Traefik, Caddy or nginx that you configured, set it to `true`.
Exposed directly, leave it unset — otherwise a client can spoof the header and
hand itself an unlimited quota. See [Security model](/architecture/security).

## Example file

```dotenv
GITHUB_TOKEN=github_pat_xxx
GITHUB_OWNER=your-username
GITHUB_REPO=my-content-repo

ARTICLES_PATH=articles
POSTS_PATH=posts
MEDIA_PATH=media

SERVER_URL=https://mdvault.example.com
TRUSTED_PROXY=true
```

In development the same file is read from `mdvault/.env.local`; in production
the values are passed to the container as environment variables.
