---
title: Editor
description: Write rich Markdown or plain text, manage blocks and images, and preview before saving.
order: 50
---

Articles and rich Vault types use the rich editor. Posts and plain Vault types
use a text-only editor. Both save portable files with YAML frontmatter in your
GitHub repository. The screenshots and controls below reflect v1.3.0,
described in the [changelog](/changelog).

![The current rich editor, with formatting tools, block controls and document settings](/screenshots/editor.png)

## Rich text and Markdown

Use the toolbar for bold, italic, strikethrough, inline code, H2–H4 headings,
bullet and numbered lists, checklists, blockquotes, code blocks, links, images,
tables and horizontal rules. A selection menu exposes common text actions;
tables have controls for rows, columns, headers and merged cells.

Type "/" in an empty paragraph to search insertion commands, including H4,
callouts and video embeds. Code blocks have a language picker and syntax
highlighting; Mermaid code fences render as diagrams in previews.

Switch to **Source** to work on raw Markdown. Use **Preview** to inspect the
rendered result. Preview and settings panels are mutually exclusive.

The heading tools create H2–H4 to keep the document hierarchy focused. Existing
H1, H5 and H6 headings are preserved when opened and saved. The article table
of contents includes H1–H4, not headings written inside fenced code examples.

## Move and delete blocks

Hover beside a block to reveal its drag handle and trash button. Drag to
reorder, or place the cursor in a block and use **Move current block up/down**
in the editor footer. **Delete current block** is available in that same footer.

Deletion affects the whole **top-level block**. With the cursor in a list item,
table cell or callout, it removes the containing list, table or callout, not
just the selected text. There is no confirmation dialog. Use **Undo**
(Ctrl/Cmd + Z) to restore it; deleting the last block leaves a paragraph to
continue writing. These changes reach GitHub only when you save.

![Block drag and delete controls beside the document, with footer actions below](/screenshots/editor-blocks.png)

## Replace or remove an image

Insert an image from the media library or upload one from the editor. Select it
to choose 25, 50, 75 or 100 percent width, alignment and alt text/caption.

- **Replace image** opens the image picker. Choosing another source preserves
  the existing width, alignment, alt text and caption. Review that description
  if the replacement depicts something different.
- **Delete image** removes the image block from this document, not the file
  from your repository. Undo restores the block.
- Canceling replacement leaves the document unchanged.

![A selected image with size, alignment, alt text, replace and delete controls](/screenshots/editor-image.png)

Private images render through MDVault's server, without exposing your GitHub
token. To move or delete the underlying file, use the
[media library](/docs/features/media) and its usage checks.

## Writing tools

- **Callouts:** insert a default note from the toolbar, or choose a callout
  from "/". Callouts are stored as Markdown blockquotes with a type marker.
- **Find & replace:** use the toolbar or Ctrl/Cmd + F while the editor is
  focused. Search the document and replace one or all matches.
- **Outline:** jump between headings without searching the entire document.
- **Content checks:** inspect warnings such as missing alt text or empty
  headings. These are advisory checks, not a substitute for reviewing a post.
- **Paste cleanup:** rich pasted content is normalised into Markdown-friendly
  structure. The rich editor also accepts dropped or pasted image files.

## Plain text

The plain editor supports text, paragraphs, line breaks and undo/redo. It does
not interpret Markdown syntax: `**bold**`, `# headings` and HTML remain literal
text. Rich text pasted into it is flattened. It is not a Markdown textarea.

Posts and plain Vault entries use matching typography in the editor, preview
and detail page, preserving blank lines and repeated spaces while wrapping
long strings. Use a rich content type when you need headings, tables or embeds.

![The post editor with its plain-text writing surface and settings](/screenshots/post-editor.png)

## Draft recovery and saving

While you type, the editor keeps a debounced snapshot in this browser's local
storage. This is a recovery copy, **not a Git commit or a published update**.
Reopening a document can offer to restore a newer local draft; drafts older
than the committed revision are discarded. Successful saves and deletions
clear the local draft.

Saving writes a descriptive commit. If the file changed in GitHub since you
loaded it, reload and reconcile your edits instead of overwriting the newer
revision. Successful content actions refresh the relevant lists and dashboard;
this is not continuous background synchronization with every external Git edit.

## Verify your edit

Review **Preview**, save, then reopen the entry from its list. Check the saved
title, body and publishing status. Removing an image from the editor should
leave it available in Media; deleting a block should be reversible with Undo
before you leave the editing session.

## Next

- [Manage articles and publishing](/docs/features/articles)
- [Organize and safely clean up media](/docs/features/media)
