---
title: Overview
description: What MDVault is, who it is for, and how the pieces fit together.
order: 1
---

MDVault is a content management interface for Markdown that stores everything
in a GitHub repository you own — the text, its frontmatter, and every image it
references. No database, no asset host, no export format. Clone the repository
and you have the whole thing.

![The MDVault dashboard, listing content sections and recent activity](/screenshots/dashboard.png)

## The problem it solves

Writing Markdown in an editor is pleasant right up to the moment you need an
image. Then you are uploading a file somewhere else, copying a URL back, and
hoping that host still exists in three years. Meanwhile a headless CMS solves
the image problem by taking your text hostage in a database you cannot grep.

MDVault takes the third option: **one Git repository holds both**, and the
interface writes to it directly.

## How it works

You write in MDVault. Your Markdown and the images it uses are committed to one
GitHub repository. Your own website pulls the same files and renders them.

![How MDVault works: you write, one repository keeps text and media, your site pulls it (wide)](/diagrams/mdvault-flow.png)

The three stages, in one sentence each:

1. **You author.** Articles, posts, and any type you define, plus the images you
   drag in. Rich editor, live preview, autosave.
2. **One repository keeps both.** Markdown files next to a `media/` folder, with
   relative links between them. Every action is a commit with a readable
   message.
3. **Your site pulls it.** A static generator, a script, or the GitHub API reads
   the same files. MDVault is not in the serving path.

Turn MDVault off tomorrow and your content still works. That is the design
goal, not a side effect.

## What you get

| | |
|---|---|
| **Articles** | Long-form Markdown with description, tags, cover image, and FR/EN translation pairs |
| **Posts** | Short plain-text notes, optionally attached to an article |
| **Vault** | Content types you define yourself — projects, notes, recipes — each with its own folder and icon |
| **Media** | Drag-and-drop uploads, compressed in the browser, served through the app so private repositories work |
| **Editor** | WYSIWYG with tables, code highlighting, image sizing and alignment; plain text where you prefer it |
| **Search** | Command palette on `Ctrl/Cmd + K`, plus filters that live in the URL |

## Who it is for

Someone who already writes in Markdown and already uses Git, and wants a
comfortable interface over both without giving up either. A developer's blog, a
documentation repository, a portfolio, a personal knowledge base.

It is **not** a multi-tenant CMS. MDVault has no login of its own and acts as a
single GitHub identity — read [Security model](/architecture/security) before
putting it anywhere public.

## The shape of a repository

```
my-content-repo/
├── mdvault.config.json
├── articles/docker-nfs.md
├── posts/why-code.md
├── media/docker-nfs-cover.png
└── vault/projects/remote-control.md
```

A file's name is its identity. Frontmatter at the top, Markdown below, images
beside it. Details in [Repository layout](/reference/repository-layout).

## Where to go next

- Running it: [Installation](/getting-started/installation)
- Understanding the write path: [Architecture overview](/architecture/overview)
- Reading the content from your own site:
  [Consume your content](/guides/consume-your-content)
