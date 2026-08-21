---
title: Posts
description: Short plain-text notes, optionally attached to an article.
order: 20
---

Posts are the short form: no description, no tags, no translation grouping.
They live in `posts/` (or `POSTS_PATH`) and are written in a plain-text editor
rather than the WYSIWYG one.

![The post list, showing excerpts generated from each body](/screenshots/posts.png)

```markdown
---
title: Release 1.4 is out
published: true
lang: en
author: Victor
article: deploying-with-docker
createdAt: 2026-02-02T10:00:00.000Z
updatedAt: 2026-02-02T10:00:00.000Z
publishedDate: 2026-02-02T10:00:00.000Z
---

Shipped today: faster media, fewer clicks.
```

## The `article` field

A post can point at an article by id. Nothing enforces that the target exists —
it is a soft reference, useful for building "discussed in" links on your own
site. Use it for release notes attached to a guide, or a short comment on a
longer piece.

## Why plain text

Posts are usually written in one sitting and rarely need tables or headings, so
the editor is a textarea with Markdown syntax, not a rich editor. What you type
is exactly what lands in the file. If a post grows into something that needs
structure, it probably wants to be an [article](/features/articles).

Cards in the post list show an excerpt derived from the body: code blocks,
images and Markdown syntax are stripped, and the text is truncated at a word
boundary. Write a first sentence worth reading.

## Lists and filters

The post list uses the same search, status, language and sort controls as
articles, minus the tag filter, and keeps its state in the URL the same way.

Commits follow the same naming: `Create post: <title>`,
`Update post: <title>`, `Publish post: <title>`.
