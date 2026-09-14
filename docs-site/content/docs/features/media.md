---
title: Media
description: Images in the same repository as the text, served through the app.
order: 40
---

Images live in `media/` (or `MEDIA_PATH`), next to the Markdown that uses them.
There is no CDN account to create and no asset host to migrate away from:
cloning the repository gets you the pictures too.

![The media library, with format filters and a grid of uploaded assets](/screenshots/media.png)

## Uploading

Drop files into the media library, or insert them straight from the editor.
Before anything is uploaded, the browser compresses the image:

- GIF, AVIF and SVG are left alone — re-encoding them loses animation or
  vectors.
- JPEG becomes WebP; PNG is tried as both WebP and PNG, and the smaller wins.
- Anything larger than 2560 px on its longest side is downscaled.
- Quality is attempted at 0.92, then 0.86, then 0.80.
- The result is kept **only if it is at least 15 % smaller** than the original.
  Otherwise your file is uploaded untouched.

Compression happens client-side, so the server never handles the original
multi-megabyte file.

## Organizing and checking usage

Search by filename or folder, filter by format, and select up to 100 assets at
a time. **Move** accepts a folder relative to `MEDIA_PATH`; leave it empty to
move files back to the root. New folders are created automatically.

Moving updates image references in articles, posts and Vault entries in the
same Git commit as the files. Existing destination files are never overwritten.
A changed file revision or concurrent repository update blocks the operation.

**Scan usage** reads managed Markdown and MDX content on the default branch:

- **Unused** lists images with no detected references in that content.
- **Missing** lists referenced images absent from the library, with links to
  the affected entries.
- Deletion rechecks usage on the server and blocks files still referenced.
  Bulk deletion is one atomic commit; files remain recoverable in Git history.

External sites, unsaved drafts, other branches and files outside the managed
content folders are not scanned. Check these consumers before moving or deleting.
Code examples count conservatively as references. Remote images outside the
configured repository are not checked for availability.

Scans fail closed on unreadable documents, ambiguous references or incomplete
repository trees. Limits are 2,500 documents, 20 MB total and 2 MB per document.

## Serving

Images are not linked directly to GitHub. They are requested from the app:

```
/api/media?path=media%2Ftutorials%2Fcover.png&v=<sha>&w=800
```

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as MDVault server
  participant G as GitHub API
  B->>A: GET /api/media?file=cover.png&v=sha
  A->>A: resolve path under MEDIA_PATH, reject traversal
  A->>G: fetch blob with GITHUB_TOKEN
  G-->>A: image bytes
  A-->>B: bytes + ETag + Cache-Control immutable
  B->>A: later request with If-None-Match
  A-->>B: 304 Not Modified
```

Two reasons for the indirection. First, **the token stays on the server** — a
private repository's images would otherwise be unreachable from the browser, or
would leak the credential. Second, it gives the app a place to set caching and
resize.

| Parameter | Effect |
|---|---|
| `path` | Full repository path under `MEDIA_PATH`, including subfolders |
| `file` | Legacy filename-only alternative for files directly in `MEDIA_PATH` |
| `v` | Any version marker, usually the blob SHA. Makes the response `immutable` for a year |
| `w` | Target width; returns a downscaled WebP |

Without `v`, the response is cached for 60 seconds with a week of
`stale-while-revalidate` — fresh enough that replacing an image shows up
quickly, cheap enough that a gallery does not hammer the GitHub API.

The filename is a query parameter rather than a path segment because a URL
ending in `.png` is claimed by the static-asset middleware before the router
sees it.

Full status codes are listed in [HTTP endpoints](/docs/reference/http-endpoints).

Building the same proxy in your own app is covered step by step in
[Serve private images](/docs/guides/serve-private-images).

## Sizing and alignment

Width and alignment chosen in the editor are stored in the Markdown link's
fragment:

```markdown
![A diagram](media/diagram.png#w=50&align=left)
```

Widths are limited to 25, 50, 75 and 100 percent, alignment to `left`,
`center`, `right`. The fragment is not part of the repository path, so the
image still resolves after a round-trip through any other Markdown tool — and a
renderer that ignores fragments simply shows the image full width.

## Path safety

A media file must remain under the configured media root. Nested folders are
supported through `path`; `file` remains restricted to a single filename.
Traversal segments (`..`, `.`), NUL bytes, unsupported file types and paths
outside the media root are rejected.

SVG uploads are sanitised before being stored, since an SVG can carry script.
