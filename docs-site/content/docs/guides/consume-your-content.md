---
title: Consume your content
description: Read what MDVault writes from a site generator, a script, or the GitHub API.
order: 10
---

MDVault writes; something else usually reads. Because the storage format is
plain Markdown in Git, every reader you already know works — no export, no API
client, no lock-in.

Two pages go deeper than this overview: [Fetch articles](/docs/guides/fetch-articles)
for getting the text, and [Serve private images](/docs/guides/serve-private-images)
for getting the pictures that text references.

## From a static site generator

Point your generator at the content folder. Astro, Eleventy, Hugo, Next and
friends all read Markdown with frontmatter natively.

If the content lives in the same repository as your site, that is all. If it
lives in a separate repository — the usual setup — add it as a submodule, or
clone it in CI before the build:

```bash
git clone --depth 1 https://github.com/you/my-content-repo content
npm run build
```

Filter on `published` so drafts never ship:

```js
const posts = all.filter((entry) => entry.data.published === true);
```

## From a script

Nothing special is needed — read the files:

```ts
import { readdir, readFile } from "node:fs/promises";
import matter from "gray-matter";

const files = await readdir("content/articles");
const articles = await Promise.all(
  files
    .filter((name) => name.endsWith(".md"))
    .map(async (name) => {
      const raw = await readFile(`content/articles/${name}`, "utf8");
      const { data, content } = matter(raw);
      return { id: name.replace(/\.md$/, ""), ...data, body: content };
    }),
);
```

The field list is in [Frontmatter](/docs/reference/frontmatter).

## Over the GitHub API

For a public repository, raw URLs work directly:

```
https://raw.githubusercontent.com/you/my-content-repo/main/articles/my-post.md
```

For a private one, use the contents API with a read-only token. Note the rate
limits — 60 unauthenticated requests per hour, 5 000 authenticated — and cache
accordingly. Working code, including the large-blob fallback and the retry
rules, is in [Fetch articles](/docs/guides/fetch-articles).

## Images

Markdown references images as repository paths, `media/cover.png`. Your reader
has to map those to real URLs:

- **Public repository**: rewrite to `raw.githubusercontent.com`, or copy the
  `media/` folder into your build output and rewrite to a local path.
- **Private repository**: copy the files during the build, or proxy them
  yourself. Do not expose a token in the browser.
  [Serve private images](/docs/guides/serve-private-images) walks through MDVault's
  own proxy — validation, caching, resizing and the framework traps.

Remember the display fragment: `media/img.png#w=50&align=left`. Strip it before
resolving the file, or handle it — the width is a percentage and the alignment
is one of `left`, `center`, `right`. A renderer that ignores fragments shows the
image full width, which is a reasonable fallback.

## Rebuilding on change

Every save is a commit, so a push webhook on the content repository is your
rebuild trigger. On Vercel, Netlify or Cloudflare Pages, a deploy hook called
from a GitHub Action on push does the job:

```yaml
on:
  push:
    branches: [main]
jobs:
  rebuild:
    runs-on: ubuntu-latest
    steps:
      - run: curl -X POST "${{ secrets.DEPLOY_HOOK }}"
```

Publishing then means pressing Publish in MDVault and waiting for the build.
