---
title: HTTP endpoints
description: The two routes MDVault exposes over HTTP, and what they return.
order: 40
---

MDVault is an application, not an API product. Content is read and written
through server functions bound to the interface, which are not a stable public
contract. Two plain HTTP endpoints exist and can be relied on.

If you want programmatic access to your content, read it from Git — see
[Consume your content](/docs/guides/consume-your-content).

## `GET /api/media`

Serves an image from the repository's media folder.

| Query parameter | Required | Meaning |
|---|---|---|
| `file` | Yes | Filename only, no folders |
| `v` | No | Version marker, usually the blob SHA |
| `w` | No | Target width in pixels; returns a downscaled WebP |

**Responses**

| Status | When |
|---|---|
| `200` | Image bytes |
| `304` | `If-None-Match` matches the current ETag |
| `400` | `file` is missing |
| `404` | Path rejected by validation, or the file does not exist |
| `429` | Rate limited. `Retry-After` gives the delay in seconds |
| `502` | GitHub returned an error |

**Headers on a `200`**

| Header | Value |
|---|---|
| `Content-Type` | Detected from the file |
| `Content-Length` | Byte length |
| `ETag` | Blob identity, used for `304` |
| `Cache-Control` | `public, max-age=31536000, immutable` with `v`, otherwise `public, max-age=60, stale-while-revalidate=604800` |
| `X-Content-Type-Options` | `nosniff` |

```bash
curl -i "http://127.0.0.1:3000/api/media?file=cover.png&v=8f2a...&w=800"
```

Behaviour and rationale are covered in [Media](/docs/features/media).
Reimplementing it elsewhere is covered in
[Serve private images](/docs/guides/serve-private-images).

## `GET /api/ping`

Returns the text `pong`. Use it as a container health check:

```yaml
healthcheck:
  test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3000/api/ping"]
  interval: 30s
  timeout: 3s
  retries: 3
```

It answers as soon as the server is up. It does **not** verify that the GitHub
token is valid — a healthy ping with a broken token is possible, and the
dashboard is where you would see that.

## Rate limits

Both endpoints sit behind the same limiter: per client and per 60-second
window, 300 read requests and 20 writes. Exceeding it returns `429` with
`Retry-After`. Details in [Security model](/docs/architecture/security).
