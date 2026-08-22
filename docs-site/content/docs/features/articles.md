---
title: Articles
description: Long-form Markdown with frontmatter, drafts, tags and translations.
order: 10
---

Articles are MDVault's main content type: a Markdown file with YAML
frontmatter, stored in `articles/` (or whatever `ARTICLES_PATH` points at).
One article is one file, and its filename without the extension is its id.

![The article list, with search, status and language filters](/screenshots/articles.png)

## What a file looks like

```markdown
---
title: Deploying with Docker
description: A short guide to running the app in production.
published: true
lang: en
author: Victor
tags: [docker, ops]
coverImage: media/docker-cover.png
createdAt: 2026-01-12T09:00:00.000Z
updatedAt: 2026-01-14T17:22:00.000Z
publishedDate: 2026-01-12T09:00:00.000Z
translationKey: deploying-with-docker-k3f9zq
---

The body starts here.
```

Every field is validated on save; the exact rules are in
[Frontmatter reference](/docs/reference/frontmatter).

## Draft and published

`published` is a boolean, nothing more — MDVault does not schedule. Publishing
stamps `publishedDate` with the current time; editing a published article
preserves it. Unpublishing clears it, so re-publishing later yields a fresh
date rather than resurrecting the old one.

Both states live in the same folder and are committed the same way. If your
site generator should ignore drafts, filter on `published` when you read the
repository — see [Consume your content](/docs/guides/consume-your-content).

## Tags

Up to ten tags, each matching letters, digits, hyphens and underscores. The
article list collects every tag in use and offers them as filters, so a typo
shows up immediately as a tag with a single article behind it.

## Translations

An article declares a language, `fr` or `en`. Two articles that are versions of
the same text share a `translationKey`, generated from the title plus a random
suffix — titles collide, random suffixes do not.

The editor sidebar links an article to a candidate in the other language, and
the list shows which languages a group covers and which are missing. When two
articles in the same group claim the same language, the group is flagged as
conflicting: a reader following the key cannot tell which one to show.

Articles without a key are unrelated to everything, including each other. They
are not silently grouped under an empty key.

## Cover image

`coverImage` accepts a repository path such as `media/cover.png` or an absolute
URL. Repository paths are served through the app's image endpoint, which is
what makes covers work even in a private repository — see
[Media](/docs/features/media).

## Reading and writing

The list at **/cms/articles** supports full-text search over title,
description, author, tags and body, plus filters for status, language and tags,
and sorting by date or title. Every filter lives in the URL, so a filtered list
is a link you can share or bookmark.

Saving writes a commit named `Update article: <title>`; creating writes
`Create article: <title>`. Concurrent edits are rejected rather than merged, as
described in [Architecture overview](/docs/architecture/overview).
