---
title: Fetch articles
description: Read published articles from the content repository — at build time, from a server, or through the GitHub API.
order: 11
---

Articles are Markdown files with YAML frontmatter, committed to a GitHub
repository. Reading them is a file read, an API call, or a `git clone` —
whichever fits your runtime. This page shows the three shapes that actually
come up, and the details that bite.

## Which shape do you need?

```mermaid
flowchart TD
  A[Where does your reader run?] --> B{Can it clone the repo?}
  B -- Yes, in CI --> C[Clone at build time, read from disk]
  B -- No, runtime only --> D{Is the repo public?}
  D -- Public --> E[raw.githubusercontent.com, cache in memory]
  D -- Private --> F[GitHub contents API with a server-side token]
```

A clone is the cheapest and the most reliable: no rate limit, no token in
production, no network during rendering. Prefer it unless your content must
appear without a rebuild.

## At build time, from a clone

Clone the content repository into the build, then read the folder. Depth 1 is
enough — you want the files, not the history.

```bash
git clone --depth 1 --branch main \
  "https://x-access-token:$CONTENT_TOKEN@github.com/you/my-content-repo" content
```

```ts
import { readdir, readFile } from "node:fs/promises";
import matter from "gray-matter";

export type Article = {
	id: string;
	title: string;
	description?: string;
	tags?: Array<string>;
	published: boolean;
	publishedAt?: string;
	body: string;
};

export async function loadArticles(dir = "content/articles") {
	const names = (await readdir(dir)).filter((name) => name.endsWith(".md"));

	const articles = await Promise.all(
		names.map(async (name) => {
			const raw = await readFile(`${dir}/${name}`, "utf8");
			const { data, content } = matter(raw);
			return { id: name.replace(/\.md$/, ""), ...data, body: content } as Article;
		}),
	);

	return articles
		.filter((article) => article.published)
		.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}
```

Two rules worth enforcing in code rather than in your head:

- **Filter on `published`.** Drafts live in the same folder; nothing but this
  flag separates them from what is live.
- **Treat the filename as the identity.** MDVault never renames a file to
  follow a changed title, so the slug is stable and your permalinks survive
  edits. The full field list is in [Frontmatter](/docs/reference/frontmatter).

## At runtime, over the GitHub API

When the reader has to see a new article without a rebuild, list the folder and
fetch each file. Use Octokit — it handles the base64 decoding and the error
shapes for you.

```ts
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.CONTENT_TOKEN });

export async function listArticles(owner: string, repo: string, path = "articles") {
	const { data } = await octokit.repos.getContent({ owner, repo, path });
	if (!Array.isArray(data)) throw new Error(`${path} is not a directory`);

	return data
		.filter((entry) => entry.type === "file" && entry.name.endsWith(".md"))
		.map((entry) => ({ id: entry.name.replace(/\.md$/, ""), sha: entry.sha }));
}

export async function readArticle(owner: string, repo: string, id: string) {
	const { data } = await octokit.repos.getContent({
		owner,
		repo,
		path: `articles/${id}.md`,
	});

	if (Array.isArray(data) || data.type !== "file") throw new Error("not a file");
	if (data.encoding !== "base64") throw new Error(`unexpected encoding ${data.encoding}`);

	return {
		sha: data.sha,
		raw: Buffer.from(data.content, "base64").toString("utf8"),
	};
}
```

Three things MDVault's own client does, and you should copy:

- **Never request `format: "raw"`.** It returns the bytes but drops the blob
  SHA, and the SHA is what you need for caching and for conflict detection on
  write.
- **Handle the empty-`content` case.** Above roughly 1 MB the contents API
  returns metadata with an empty body; fall back to
  `octokit.git.getBlob({ owner, repo, file_sha: sha })`.
- **Read `retry-after` on a 403 or 429**, and fall back to
  `x-ratelimit-reset` when it is absent. Authenticated calls get 5 000 per
  hour, unauthenticated ones 60 — a listing plus one fetch per article burns
  through the second number in a single page render.

For a public repository you can skip the API entirely and hit
`https://raw.githubusercontent.com/you/repo/main/articles/my-post.md`. It is
served from a CDN and is not rate limited the same way, but it has no
conditional-request story of its own, so keep your own cache.

## Cache what you fetch

Any runtime reader needs a cache in front of GitHub. The pattern MDVault uses
for images applies unchanged to Markdown: keep an in-memory map keyed by
`path + sha`, deduplicate concurrent requests for the same key so a burst
produces one upstream call, and serve the stale copy when GitHub is failing
rather than propagating a 502. That code is walked through in
[Serve private images](/docs/guides/serve-private-images) — the store there is
content-agnostic.

## Rebuild when content changes

Every save in MDVault is a commit, so a push webhook on the content repository
is a rebuild trigger:

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

Publishing then means pressing Publish and waiting for the build. If that wait
is unacceptable, you are in the runtime-fetch case above.

## Next

Articles reference images as repository paths, and those need resolving —
continue with [Serve private images](/docs/guides/serve-private-images).
