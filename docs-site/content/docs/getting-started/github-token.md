---
title: GitHub token
description: Create a token with exactly the permissions MDVault needs, and no more.
order: 20
---

MDVault talks to GitHub through the REST API with a single token. That token is
the application's only credential — it is what commits your articles, uploads
your images and reads them back.

## Fine-grained token (recommended)

In **Settings → Developer settings → Personal access tokens → Fine-grained
tokens**, create a token scoped to *only* your content repository:

| Permission | Access |
|---|---|
| Contents | Read and write |
| Metadata | Read-only |

Metadata is mandatory on fine-grained tokens; GitHub grants it automatically
once you select a repository. Nothing else is needed — MDVault never opens
issues, never reads other repositories, and never touches your account settings.

## Classic token

A classic token works too, but its narrowest usable scope is `repo`, which
grants write access to **every** repository you own. Prefer the fine-grained
token; use a classic one only if your organization blocks them.

## Where it lives

The token is read from the `GITHUB_TOKEN` environment variable on the server. It
is never sent to the browser: images from private repositories are fetched
server-side and re-served through the app's own endpoint, precisely so the token
stays out of the page. See [Media](/docs/features/media).

## Rotating it

Tokens expire. When yours does, every read and write fails at once and the
dashboard reports the error rather than silently showing empty lists. Replace
the value and restart the container:

```bash
docker rm -f mdvault
docker run -d --name mdvault -p 127.0.0.1:3000:3000 \
  -e GITHUB_TOKEN=the_new_token \
  -e GITHUB_OWNER=your_username \
  -e GITHUB_REPO=your_repo \
  ghcr.io/victor3spoir/mdvault:latest
```

Nothing is lost by restarting: MDVault holds no state of its own. Every piece of
content already lives in the repository.
