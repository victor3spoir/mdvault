---
title: Editor
description: WYSIWYG for articles, plain text for posts, Markdown on disk either way.
order: 50
---

Two editors, one output. Whatever you use, the file committed to your
repository is Markdown with YAML frontmatter — readable, diffable, and portable
to any other tool.

![The rich editor with the settings sidebar open on language, description, tags and cover image](/screenshots/editor.png)

## Rich editor

Used for articles and for vault types declared as `rich`. The toolbar covers
bold, italic, strikethrough, inline code, headings 2 to 6, bullet, numbered and
task lists, blockquotes, code blocks, links, images, tables and horizontal
rules. Undo and redo are there too.

A selection menu appears over highlighted text for the common actions, and
tables get their own menu for adding and removing rows and columns.

Code blocks are syntax-highlighted while you type, in more than twenty
languages.

## Plain editor

Used for posts and for vault types declared as `plain`. A textarea with
Markdown syntax and a live preview — no hidden transformation between what you
type and what is stored.

## Images inside the editor

Insert from the media library or upload on the spot. Once placed, an image can
be resized to 25, 50, 75 or 100 percent, aligned left, centre or right, and
given alt text and a caption. Those choices ride along in the Markdown link, as
described in [Media](/features/media).

Images from a private repository render correctly in the editor, because they
are fetched through the app rather than from GitHub directly.

## Autosave and draft recovery

While you type, the editor saves a snapshot to the browser's local storage —
debounced, roughly a second after you stop. This is **not** a commit; it is a
safety net for a closed tab or a browser crash.

Reopening a document that has a newer local snapshot than the committed version
offers to restore it. If the snapshot is older than the file in GitHub, it is
discarded silently: the committed version has moved on.

Local drafts are cleared once the document is saved or deleted.

## Command palette

**Ctrl/Cmd + K** anywhere in the interface. It searches your articles, posts
and vault assets by title, and offers the navigation actions — new article, new
post, dashboard, media, settings, and one "new" plus one "browse" entry per
vault type. Arrow keys to move, Enter to go, Escape to close.

## Saving

Saving writes one commit with a descriptive message. If the file changed in
GitHub since you loaded it, the save is refused with "changed in GitHub — reload
it before saving again" rather than overwriting someone else's work. Reload,
re-apply your change, save.
