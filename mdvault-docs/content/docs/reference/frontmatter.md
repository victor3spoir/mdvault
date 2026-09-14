---
title: Frontmatter
description: Every field, its type, and the limit that will reject your save.
order: 30
---

Frontmatter is YAML between `---` fences at the top of the file. It is
validated on save; a value that breaks a rule is refused with the reason rather
than written and forgotten.

## Article

| Field | Type | Rule |
|---|---|---|
| `title` | string | Required, ≤ 200 characters, cannot be only digits and dots |
| `description` | string | ≤ 500 characters |
| `published` | boolean | Defaults to `false` |
| `lang` | `fr` \| `en` | Defaults to `en` |
| `author` | string | ≤ 100 characters |
| `tags` | string[] | ≤ 10 entries, each matching `^[a-zA-Z0-9\-_]+$` |
| `coverImage` | string | Repository path or absolute URL |
| `createdAt` | string | ISO timestamp, set on creation |
| `updatedAt` | string | ISO timestamp, refreshed on every save |
| `publishedDate` | string | ISO timestamp, stamped when publishing |
| `translationKey` | string | ≤ 64 characters, `^[a-z0-9]+(?:-[a-z0-9]+)*$` |

The body is limited to 500 000 characters and cannot be whitespace only.

## Post

Same as an article, minus `description`, `tags` and `translationKey`, plus:

| Field | Type | Rule |
|---|---|---|
| `article` | string | Id of a related article. Not verified to exist |

## Vault asset

Same as an article, minus `translationKey`, plus:

| Field | Type | Rule |
|---|---|---|
| `type` | string | Id of a type declared in `mdvault.config.json` |

## Notes

**Dates are written by the app.** You can edit them by hand in Git, but the next
save through the interface refreshes `updatedAt`.

**Missing optional fields are omitted, not written empty.** A file without
`tags` is normal; `tags: []` is equally valid.

**Unknown fields survive a round-trip only if you edit the file in Git.** Saving
through the interface writes the schema's fields. If your generator needs an
extra key, keep it in the body or accept that MDVault will not preserve it.

**Title and author are sanitised** before being stored, which strips control
characters and stray markup.
