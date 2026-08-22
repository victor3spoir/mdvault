---
title: Repository layout
description: What MDVault creates in your content repository, and where.
order: 20
---

MDVault writes to a small, predictable set of paths. Everything else in the
repository is ignored, so a content repository can also hold a site generator,
a README, or CI workflows.

```
my-content-repo/
├── mdvault.config.json     # custom content types, written by Settings
├── articles/               # ARTICLES_PATH
│   ├── deploying-with-docker.md
│   └── deployer-avec-docker.md
├── posts/                  # POSTS_PATH
│   └── release-1-4.md
├── media/                  # MEDIA_PATH, one level deep only
│   ├── docker-cover.png
│   └── diagram.webp
└── vault/
    ├── projects/
    │   └── my-first-project.md
    └── notes/
        └── field-note-01.md
```

## Rules worth knowing

**Filename is identity.** `articles/deploying-with-docker.md` has the id
`deploying-with-docker`. Renaming a file in Git renames the content; there is no
separate identifier to keep in sync.

**`.md` and `.mdx` are both accepted** when reading a document. New files are
written as `.md`.

**Media is flat.** Files must sit exactly one level under the media root.
`media/2026/cover.png` is not served — the image endpoint uses the filename
only, which is what lets you rename the media folder without rewriting every
link.

**Vault folders are named after type ids.** A type with id `projects` stores its
assets in `vault/projects/`. See [Vault](/docs/features/vault).

**Folders appear on first save.** A fresh repository is empty; nothing is
scaffolded until you create content.

## `mdvault.config.json`

The only file MDVault writes outside the content folders. It is always at the
repository root, always named exactly that, and holds a `version` integer plus
the `assetTypes` array. Edit it through Settings rather than by hand — the
interface validates ids, labels, icons and reserved words before committing.

## Path validation

Every path derived from user input is normalised before it reaches GitHub.
Absolute paths, `..`, `.` and NUL bytes are rejected outright, and identifiers
must match `^[A-Za-z0-9][A-Za-z0-9._-]*$`. A request cannot escape the folder
it belongs to.
