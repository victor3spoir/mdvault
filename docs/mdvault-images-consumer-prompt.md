# MDVault — Serving Repository Images Through `/api/media`

You are implementing image handling for a website whose content is authored in **MDVault**.

Images live in the MDVault GitHub repository and must be served through an `/api/media`
endpoint **that you create in your own app**. Never inline them as base64.

This endpoint serves **images only**. Fetching articles and posts is a separate concern and
is not covered here.

Follow these steps in order.

---

## What you are building

```
Your site
├── lib/media-cache.ts    # disk cache: single-flight, bounded queue, retries
├── lib/media-store.ts    # reads blobs from GitHub
├── app/api/media         # the endpoint that serves image bytes
└── components/           # <MdvaultImage> — builds the URL, applies layout
```

**Why an endpoint and not base64:** measured on a 39-image gallery (30.9 MB of files).

| | Base64 data URLs | `/api/media` |
|---|---|---|
| HTML document | **42.3 MB** | **421 KB** |
| Transferred, 400px thumbnails | 30.9 MB | **0.36 MB** |
| Repeat visit | **42 MB again** | **0.02 MB** |
| Browser caching | impossible | yes |
| `loading="lazy"` | inert | works |

Base64 inflates bytes ~33%, is part of the HTML so it can never be cached separately, leaves
nothing to lazy-load, and blocks the first paint until the whole document arrives.

---

## What MDVault stores

```
your-content-repo/
├── articles/<uuid>.md      # Markdown body
├── posts/<uuid>.md         # plain-text body
└── media/<uuid>.<ext>      # flat, never nested
```

```yaml
---
title: 'Docker + NFS : Optimisez la persistance de vos données'
description: 'Une approche auto-hébergée pour centraliser les volumes Docker.'
published: true
lang: fr
tags: [docker, devops]
coverImage: media/f07191c2-5a3c-445f-b5fa-f83e9152980d.png
createdAt: '2025-09-01T04:10:00.000Z'
updatedAt: '2026-03-04T23:55:40.362Z'
---

Body in Markdown. Images look like this:

![Architecture](media/a1b2c3d4.png)
![Schéma](media/a1b2c3d4.png#w=50&align=left)
```

Two facts drive the design:

1. Image paths are **repository-relative** — `media/<uuid>.ext`, in bodies **and** in
   `coverImage`. They are not URLs and 404 if rendered as-is.
2. Filenames are **UUIDs** and MDVault never rewrites a file in place. A filename always holds
   the same bytes — **every image is safe to cache forever.**

---

## Step 1 — Install

```bash
npm install @octokit/rest
npm install sharp          # for on-the-fly resizing (Step 5)
```

```bash
# .env — server-side only, never exposed to the client
GITHUB_TOKEN=github_pat_...        # read-only, contents scope
GITHUB_OWNER=your-username
GITHUB_REPO=your-content-repo
MEDIA_PATH=media
MEDIA_CACHE_DIR=/var/cache/media   # mount as a volume in Docker
```

---

## Step 2 — The media cache layer

Do not call GitHub directly from the route. A page requesting 40 images trips GitHub's
secondary rate limits within seconds.

Six properties, each fixing a real failure:

| Property | Failure it prevents |
|---|---|
| Disk cache | A restart re-downloads everything |
| Single-flight | 40 requests for one image → 40 API calls |
| Bounded queue (6) | A burst trips rate limits |
| Retry honoring `Retry-After` | A transient spike breaks the page |
| Stale-on-error | A rate limit beats a broken image |
| Distinct outcomes | A failure must never become a 404 |

```ts
// lib/media-cache.ts
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface MediaBlob {
  bytes: Uint8Array;
  contentType: string;
  etag: string;
}

export type MediaFetchOutcome =
  | { status: "ok"; blob: MediaBlob }
  | { status: "not-found" }
  | { status: "rate-limited"; retryAfterSeconds: number }
  | { status: "error"; message: string };

export function createMediaStore({
  readBlob,
  cacheDir = join(tmpdir(), "media-cache"),
  concurrency = 6,
  ttlMs = 5 * 60 * 1000,
  maxRetries = 3,
  sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)),
  now = Date.now,
}: {
  readBlob: (path: string) => Promise<MediaFetchOutcome>;
  cacheDir?: string;
  concurrency?: number;
  ttlMs?: number;
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}) {
  const memory = new Map<string, { blob: MediaBlob; storedAt: number }>();
  const inFlight = new Map<string, Promise<MediaFetchOutcome>>();

  let active = 0;
  const waiting: Array<() => void> = [];

  async function withSlot<T>(task: () => Promise<T>): Promise<T> {
    if (active >= concurrency) {
      await new Promise<void>((resolve) => waiting.push(resolve));
    }
    active += 1;
    try {
      return await task();
    } finally {
      active -= 1;
      waiting.shift()?.();
    }
  }

  const key = (path: string, version?: string) =>
    createHash("sha1").update(`${path}::${version ?? ""}`).digest("hex");

  async function readDisk(k: string) {
    try {
      const parsed = JSON.parse(await readFile(join(cacheDir, `${k}.json`), "utf8"));
      return {
        storedAt: parsed.storedAt,
        blob: {
          bytes: new Uint8Array(Buffer.from(parsed.base64, "base64")),
          contentType: parsed.contentType,
          etag: parsed.etag,
        },
      };
    } catch {
      return null;
    }
  }

  async function writeDisk(k: string, entry: { blob: MediaBlob; storedAt: number }) {
    try {
      await mkdir(cacheDir, { recursive: true });
      await writeFile(join(cacheDir, `${k}.json`), JSON.stringify({
        contentType: entry.blob.contentType,
        etag: entry.blob.etag,
        storedAt: entry.storedAt,
        base64: Buffer.from(entry.blob.bytes).toString("base64"),
      }));
    } catch {
      // A cache that cannot be written must never fail the request.
    }
  }

  async function load(path: string): Promise<MediaFetchOutcome> {
    let last: MediaFetchOutcome | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const outcome = await withSlot(() => readBlob(path));
      if (outcome.status === "ok" || outcome.status === "not-found") return outcome;

      last = outcome;
      if (attempt === maxRetries) break;

      const backoff = outcome.status === "rate-limited"
        ? Math.max(outcome.retryAfterSeconds * 1000, 2 ** attempt * 250)
        : 2 ** attempt * 250;
      await sleep(backoff);
    }

    return last ?? { status: "error", message: "Unavailable" };
  }

  return {
    async get(path: string, version?: string): Promise<MediaFetchOutcome> {
      const k = key(path, version);

      const cached = memory.get(k) ?? (await readDisk(k));
      if (cached) {
        memory.set(k, cached);
        // A versioned entry is immutable: it never needs revalidating.
        if (version !== undefined || now() - cached.storedAt < ttlMs) {
          return { status: "ok", blob: cached.blob };
        }
      }

      const pending = inFlight.get(k);
      if (pending) return pending;                    // single-flight

      const request = (async (): Promise<MediaFetchOutcome> => {
        const outcome = await load(path);

        if (outcome.status === "ok") {
          const entry = { blob: outcome.blob, storedAt: now() };
          memory.set(k, entry);
          await writeDisk(k, entry);
          return outcome;
        }

        // Rather than fail, keep serving what we already have.
        if (cached && outcome.status !== "not-found") {
          return { status: "ok", blob: cached.blob };
        }

        return outcome;
      })().finally(() => inFlight.delete(k));

      inFlight.set(k, request);
      return request;
    },
  };
}
```

Inject `readBlob`, `sleep` and `now` — that is what makes retries and expiry testable without
a network or real delays.

---

## Step 3 — Reading blobs from GitHub

```ts
// lib/media-store.ts
import { Octokit } from "@octokit/rest";
import { createMediaStore, type MediaFetchOutcome } from "./media-cache";

const MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", avif: "image/avif",
};

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function readBlob(path: string): Promise<MediaFetchOutcome> {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  const contentType = MIME[extension];
  if (!contentType) return { status: "not-found" };

  const owner = process.env.GITHUB_OWNER!;
  const repo = process.env.GITHUB_REPO!;

  try {
    const res = await octokit.repos.getContent({ owner, repo, path });
    if (Array.isArray(res.data) || res.data.type !== "file") {
      return { status: "not-found" };
    }

    let base64 = res.data.content ?? "";

    // Over 1 MB the contents API returns an empty body with only a SHA.
    if (!base64.trim()) {
      const blob = await octokit.git.getBlob({ owner, repo, file_sha: res.data.sha });
      base64 = blob.data.content;
    }

    return {
      status: "ok",
      blob: {
        bytes: new Uint8Array(Buffer.from(base64, "base64")),
        contentType,
        etag: `"${res.data.sha}"`,
      },
    };
  } catch (error: any) {
    if (error?.status === 404) return { status: "not-found" };
    if (error?.status === 403 || error?.status === 429) {
      const reset = Number(error?.response?.headers?.["x-ratelimit-reset"]);
      return {
        status: "rate-limited",
        retryAfterSeconds: Number.isFinite(reset)
          ? Math.max(1, Math.ceil(reset - Date.now() / 1000))
          : 1,
      };
    }
    return { status: "error", message: "Upstream failure" };
  }
}

export const mediaStore = createMediaStore({
  readBlob,
  cacheDir: process.env.MEDIA_CACHE_DIR,
});
```

> ⚠️ **Never use `mediaType: { format: "raw" }`.** Octokit decodes raw responses as UTF-8
> text, mangling every byte above 127. Measured: **2 332 652 bytes expected, 2 213 363
> received** — and **no error is thrown.** The image is simply corrupt. Base64 survives the
> round trip intact.

---

## Step 4 — The endpoint

```
GET /api/media?file=<filename>&v=<sha>&w=<width>
```

| Param | Required | Value |
|---|---|---|
| `file` | **yes** | Bare filename — `a1b2c3.png`, never a path |
| `v` | no | Blob SHA → immutable response |
| `w` | no | `200`, `400`, `800` or `1600` → downscaled WebP |

```ts
// app/api/media/route.ts  (adapt to your framework)
import { getMedia, parseWidth } from "@/lib/media-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const file = url.searchParams.get("file");
  if (!file) return new Response("Missing file", { status: 400 });

  const path = resolveMediaPath(process.env.MEDIA_PATH ?? "media", file);
  if (!path) return new Response("Not found", { status: 404 });

  const version = url.searchParams.get("v") ?? undefined;
  const width = parseWidth(url.searchParams.get("w"));
  const outcome = await getMedia(path, { version, width });

  if (outcome.status === "not-found") return new Response("Not found", { status: 404 });

  if (outcome.status === "rate-limited") {
    return new Response("Too many requests", {
      status: 429,
      headers: { "Retry-After": String(outcome.retryAfterSeconds) },
    });
  }

  if (outcome.status === "error") return new Response(outcome.message, { status: 502 });

  const { bytes, contentType, etag } = outcome.blob;

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }

  return new Response(bytes, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(bytes.length),
      ETag: etag,
      "Cache-Control": version
        ? "public, max-age=31536000, immutable"
        : "public, max-age=60, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
```

### Path validation — not optional

`file` comes from the client. Without validation, `?file=../../.env` reads an arbitrary
repository file.

```ts
export function resolveMediaPath(root: string, fileName: string): string | null {
  const segments: string[] = [];

  for (const part of `${root}/${fileName}`.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") { segments.pop(); continue; }     // resolve, don't reject
    segments.push(part);
  }

  const rootParts = root.split("/").filter(Boolean);

  if (!rootParts.every((part, i) => segments[i] === part)) return null;   // under root
  if (segments.length !== rootParts.length + 1) return null;              // flat, one level

  return segments.join("/");
}
```

Normalize, then verify the prefix. Do **not** string-replace `..` — encodings like `%2e%2e`
walk straight past that. The extension whitelist in Step 3 also decides the `Content-Type`.

### Three traps when creating the route

1. **Keep the filename in the query string.** `/api/media/photo.png` is claimed by the
   static-asset middleware and returns an HTML 404 before your handler runs.
2. **Use an exact route, not a splat.** Some frameworks (TanStack Start) only run server
   handlers on an exact match — a splat route silently falls through to the 404 page.
3. **A failure must never become a 404.** Browsers cache 404s, so a rate limit would make
   images vanish until a hard reload. Real 404 → `404`, rate limit → `429`, upstream down →
   `502`.

---

## Step 5 — Resizing

A 400px card must not download a 2 MB asset. Measured: a 2 277 KB PNG served at `w=400` is
**16 KB — 99% smaller**.

Reuse the cache layer: instantiate a **second store** whose read produces the variant.

```ts
export const ALLOWED_WIDTHS = [200, 400, 800, 1600] as const;

export function parseWidth(value: string | null) {
  const width = Number(value);
  return ALLOWED_WIDTHS.find((allowed) => allowed === width);
}

const RESIZABLE = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const SEPARATOR = "\u0000w";                  // cannot occur in a real path

async function readVariant(key: string): Promise<MediaFetchOutcome> {
  const [path, rawWidth] = key.split(SEPARATOR);
  const width = Number(rawWidth);
  const original = await mediaStore.get(path);

  if (original.status !== "ok" || !RESIZABLE.has(original.blob.contentType)) {
    return original;                          // SVG, animated GIF: untouched
  }

  try {
    const { default: sharp } = await import("sharp");
    const image = sharp(Buffer.from(original.blob.bytes), { animated: false });
    const { width: sourceWidth } = await image.metadata();

    if (sourceWidth && sourceWidth <= width) return original;      // never upscale

    const bytes = await image
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    return {
      status: "ok",
      blob: {
        bytes: new Uint8Array(bytes),
        contentType: "image/webp",
        etag: `${original.blob.etag.replace(/"$/, "")}-w${width}"`,   // must differ!
      },
    };
  } catch {
    return original;                          // heavy image beats a broken one
  }
}

const variantStore = createMediaStore({ readBlob: readVariant, maxRetries: 0 });

export function getMedia(
  path: string,
  { version, width }: { version?: string; width?: number } = {},
) {
  return width
    ? variantStore.get(`${path}${SEPARATOR}${width}`, version)
    : mediaStore.get(path, version);
}
```

**Three mandatory guards:** a closed width list (an open `?w=` lets anyone fill your disk with
one entry per pixel value), never upscale, and fall back to the original on any failure.

**Costs:** `sharp` adds ~20 MB of platform-specific binaries — install it inside your target
image, never copy it from the host. The variant ETag **must** differ from the original's, or a
browser will serve the thumbnail in place of the full image.

---

## Step 6 — The client

### The four causes of 404

**1. Sending the path instead of the filename**

```ts
`/api/media?file=media/a1b2c3.png`   // ❌ 404
`/api/media?file=a1b2c3.png`         // ✅
```

**2. Leaving the display fragment in place** — the most common mistake

```ts
`/api/media?file=a1b2c3.png#w=50&align=left`   // ❌ 404, that is not a filename
`/api/media?file=a1b2c3.png&w=400`             // ✅
```

**3. Putting the filename in the path** — `/api/media/a1b2c3.png` returns an HTML 404.

**4. Passing an absolute URL through** — `coverImage` may already be one. Return it as-is.

### The helper

```tsx
const VALID_WIDTHS = new Set([25, 50, 75, 100]);
const VALID_ALIGNS = new Set(["left", "center", "right"]);

/** Splits `media/x.png#w=50&align=left` into a path and its display attributes. */
export function splitImageSource(source: string) {
  const hashIndex = source.indexOf("#");
  if (hashIndex === -1) return { src: source, width: null, align: null };

  const params = new URLSearchParams(source.slice(hashIndex + 1));
  const rawWidth = Number(params.get("w"));
  const rawAlign = params.get("align");

  return {
    src: source.slice(0, hashIndex),
    width: VALID_WIDTHS.has(rawWidth) ? rawWidth : null,
    align: rawAlign && VALID_ALIGNS.has(rawAlign) ? rawAlign : null,
  };
}

export function mediaUrl(
  source: string,
  { version, width }: { version?: string; width?: 200 | 400 | 800 | 1600 } = {},
) {
  if (!source?.trim()) return "";

  const { src } = splitImageSource(source);                  // 1. drop the fragment
  if (!src) return "";
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:")) return src;   // 2. external

  const filename = src.split("/").pop() ?? "";               // 3. filename only
  if (!filename) return "";

  const params = new URLSearchParams({ file: filename });
  if (version) params.set("v", version);
  if (width) params.set("w", String(width));

  return `/api/media?${params.toString()}`;
}

export function MdvaultImage({ source, alt, className, version, width, priority = false }) {
  const { width: displayWidth, align } = splitImageSource(source);
  const src = mediaUrl(source, { version, width });
  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={className}
      style={{
        width: displayWidth ? `${displayWidth}%` : undefined,
        marginLeft: align === "right" || align === "center" ? "auto" : undefined,
        marginRight: align === "left" || align === "center" ? "auto" : undefined,
      }}
    />
  );
}
```

Use it for Markdown image nodes **and** for `coverImage` — both carry `media/<uuid>.ext`.

### Rewriting Markdown images

```ts
import { visit } from "unist-util-visit";

export function remarkMdvaultMedia() {
  return (tree) => {
    visit(tree, "image", (node) => {
      if (node.url.startsWith("media/")) {
        const { src, width, align } = splitImageSource(node.url);
        node.url = mediaUrl(src, { width: 1600 });
        node.data = {
          ...node.data,
          hProperties: {
            loading: "lazy",
            decoding: "async",
            style: [
              width ? `width:${width}%` : "",
              align === "left" ? "margin-right:auto" : "",
              align === "right" ? "margin-left:auto" : "",
              align === "center" ? "margin-left:auto;margin-right:auto" : "",
            ].filter(Boolean).join(";"),
          },
        };
      }
    });
  };
}
```

### The display fragment

| Param | Values | Meaning |
|---|---|---|
| `w` | `25`, `50`, `75`, `100` | Width as a % of the container |
| `align` | `left`, `center`, `right` | Horizontal alignment |

Defaults are `w=100` and `align=center`, and MDVault omits them when they match — **a bare
path means full-width and centered.** Whitelist both; the content is authored elsewhere, so
interpolating a raw value into a style attribute is an injection point.

### Which width to request

| Context | `width` |
|---|---|
| Card, grid thumbnail | `400` |
| Preview, lightbox | `1600` |
| Article body | `1600` |
| Hero above the fold | omit, and set `priority` |

Any value outside the allowed list is **ignored silently** — you get the full-size image, no
error, just a slow page.

### Pass `version` to cache immutably

With `?v=`, the response becomes `max-age=31536000, immutable` and the browser never
revalidates. Without it, 100 images mean 100 conditional requests every 60 seconds.

`version` must be the **image blob SHA** — not the SHA of the document that references it.
Build the map once from the Git tree and cache it:

```ts
// lib/media-versions.ts
let versions: Map<string, string> | null = null;

export async function getMediaVersions() {
  if (versions) return versions;

  const tree = await octokit.git.getTree({
    owner, repo, tree_sha: "HEAD", recursive: "true",
  });

  versions = new Map(
    tree.data.tree
      .filter((node) => node.type === "blob" && node.path?.startsWith("media/"))
      .map((node) => [node.path!.split("/").pop()!, node.sha!]),
  );

  return versions;
}
```

```tsx
<MdvaultImage source={coverImage} version={versions.get(filename)} width={400} alt={title} />
```

Media filenames are UUIDs and MDVault never rewrites a file in place, so a versioned URL is
always safe to cache forever.

---

## Step 7 — Development-only fix

If your dev server is Vite, `<img>` requests 404 while `curl` returns 200 — Vite
short-circuits requests whose `Sec-Fetch-Dest` marks them as static assets. **Production is
unaffected.**

```ts
// vite.config.ts
import type { Plugin } from "vite";

function allowApiAssetRequests(): Plugin {
  return {
    name: "allow-api-asset-requests",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith("/api/")) req.headers["sec-fetch-dest"] = "empty";
        next();
      });
    },
  };
}

export default defineConfig({ plugins: [allowApiAssetRequests(), /* ... */] });
```

List it **first**. If `curl` succeeds where the browser fails, replay the browser's headers
with `curl -H` — the difference is almost always `Sec-Fetch-Dest`.

---

## Step 8 — Verify

`curl` does not reproduce what an `<img>` tag does. Run all four.

```bash
# 1. Binary integrity — catches the silent "raw" corruption
curl -s "http://localhost:3000/api/media?file=<uuid>.png" -o /tmp/o.png
git cat-file -s <blob-sha>       # must match TO THE BYTE
file /tmp/o.png                  # must report a valid PNG

# 2. A real browser request
curl -H 'Sec-Fetch-Dest: image' -o /dev/null -w '%{http_code} %{content_type}\n' \
  "http://localhost:3000/api/media?file=<uuid>.png"          # 200 image/png

# 3. Path traversal
curl -o /dev/null -w '%{http_code}\n' \
  "http://localhost:3000/api/media?file=../../.env"          # 404

# 4. Conditional request
curl -H 'If-None-Match: "<etag>"' -o /dev/null -w '%{http_code} %{size_download}\n' \
  "http://localhost:3000/api/media?file=<uuid>.png"          # 304 and 0 bytes
```

In a real browser, on a page with many images:

```js
[...document.querySelectorAll("img")].filter((i) => i.complete && i.naturalWidth === 0).length;
// expect: 0
```

If this is above zero, check the four 404 causes in Step 6 — it is almost always the fragment.

### Reference numbers

Measured on 39 images / 30.9 MB, dev server:

| Metric | Result |
|---|---|
| HTML document | 42 MB → **421 KB** |
| Transferred, 400px thumbnails | 30.9 MB → **0.36 MB** |
| Repeat visit | **0.02 MB** |
| Warm cache serve | **20 ms / image** |
| `304` revalidation | **22 ms / image** |
| Resize cost | **0.3–0.8 s / image**, once |
| First-ever load, all cold | ~15 s for 39 images, **once** |

The dominant cost is the GitHub download, not the resize. It is paid once per file, then never
again. **Do not mistake a cold first load for a timeout.**

---

## Checklist

**Correctness**
- [ ] Base64 used, never `format: "raw"`
- [ ] Blob API fallback above 1 MB
- [ ] Served size matches the repository **to the byte**
- [ ] Filename in the query string, never in the path
- [ ] Exact route, no splat
- [ ] Failures never become 404s

**Security**
- [ ] Path normalized, then verified under the root
- [ ] Exactly one segment allowed
- [ ] Extension whitelist drives `Content-Type`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] Closed width list
- [ ] `GITHUB_TOKEN` server-side only, read-only scope

**Performance**
- [ ] Image blob SHAs mapped from the Git tree, cached
- [ ] Disk cache, survives restart
- [ ] Single-flight
- [ ] Bounded queue (~6)
- [ ] `ETag` + `304`
- [ ] `immutable` when `?v=` is present
- [ ] `loading="lazy"` except above the fold
- [ ] Thumbnails requested at display width
- [ ] No base64 anywhere

**Resilience**
- [ ] Retry honors `Retry-After`
- [ ] Stale-on-error
- [ ] Cache write failures swallowed
- [ ] Resize failure → original served
- [ ] Missing image degrades to a placeholder

**Operations**
- [ ] `MEDIA_CACHE_DIR` mounted as a volume — otherwise every restart re-pays the cold cost
- [ ] `sharp` installed inside the target image

---

## Summary

Create `/api/media` backed by a disk cache with single-flight, a bounded queue and honest
error statuses. Strip the `#w=`/`#align=` fragment before building the URL, send the bare
filename as `file`, request thumbnails at display width, pass `?v=<blob-sha>` for immutable
caching, lazy-load everything but the hero, and never inline base64.
