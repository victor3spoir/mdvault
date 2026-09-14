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

Posts are usually written in one sitting and rarely need tables or headings.
Their editor accepts text, paragraphs and line breaks, with undo/redo, and
flattens pasted rich text. It does not interpret Markdown or HTML: `**bold**`
and `<strong>` remain literal text. If a post needs structure, use an
[article](/docs/features/articles).

The editor, preview and reading page share typography and preserve blank lines
and repeated spaces. Long strings wrap within the content area. The reading
page displays the body once, without a duplicate excerpt above it.

![A post in the current plain-text editor, with publishing and article settings](/screenshots/post-editor.png)

Cards in the post list show an excerpt derived from the body: code blocks,
images and Markdown syntax are stripped, and the text is truncated at a word
boundary. Write a first sentence worth reading.

## Lists and filters

The post list uses the same search, status, language and sort controls as
articles, minus the tag filter, and keeps its state in the URL the same way.

Commits follow the same naming: `Create post: <title>`,
`Update post: <title>`, `Publish post: <title>`.

## Publish and delete

Publish or unpublish from the card or editor. Delete opens a confirmation
before removing the post file. After a successful action, the list and
dashboard refresh and the active filters are reapplied. Deleting a post does
not delete its linked article or library images; recovery is through Git
history.

## Next

- [Draft recovery and editor controls](/docs/features/editor)
