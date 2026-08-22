---
title: Configuration
description: Point MDVault at your repository and decide where each content type is stored.
order: 30
---

MDVault is configured in two places, and the split is deliberate: **where the
repository is** comes from the environment, **what content types exist** comes
from a file in the repository itself.

## Environment

Three variables are required, three are optional:

| Variable | Purpose | Default |
|---|---|---|
| `GITHUB_TOKEN` | Token used to read and write repository content | Required |
| `GITHUB_OWNER` | User or organization owning the repository | Required |
| `GITHUB_REPO` | Repository name, without owner or URL | Required |
| `ARTICLES_PATH` | Folder holding articles | `articles` |
| `POSTS_PATH` | Folder holding posts | `posts` |
| `MEDIA_PATH` | Folder holding images | `media` |

A missing required variable fails loudly at first use, naming every variable
that is absent rather than the first one. The full list, including the security
variables, is in [Environment reference](/docs/reference/environment).

Changing `ARTICLES_PATH` after you have content does **not** move anything.
MDVault reads the new folder and your existing articles disappear from the list
while staying in Git. Move the files yourself, in a commit, then restart.

## Content types

Custom types live in `mdvault.config.json` at the root of your content
repository. You do not write it by hand — **Settings → Asset types** creates and
updates it:

![Settings, showing the connected GitHub account, the target repository and the asset types manager](/screenshots/settings.png)

```json
{
  "version": 1,
  "assetTypes": [
    { "id": "projects", "label": "Projects", "icon": "folder", "editor": "rich" },
    { "id": "notes", "label": "Notes", "icon": "note", "editor": "plain" }
  ]
}
```

| Field | Rule |
|---|---|
| `id` | Lowercase letters, digits and hyphens, starting with a letter, 2–30 characters. Becomes the folder name under `vault/` and a segment in the URL |
| `label` | Shown in the sidebar, up to 40 characters |
| `icon` | One of the twelve icons listed in [Vault](/docs/features/vault) |
| `editor` | `rich` for the WYSIWYG editor, `plain` for text only |

Ids are validated against a reserved list — `articles`, `posts`, `media`,
`settings`, `vault`, `new`, `edit`, `cms` — because each of those already names
a route. A maximum of twenty types is enforced, and ids must be unique.

## Local development

Running from source reads the same variables from `mdvault/.env.local`:

```dotenv
GITHUB_TOKEN=<your_github_token>
GITHUB_OWNER=your-username
GITHUB_REPO=my-content-repo

# Optional
ARTICLES_PATH=articles
POSTS_PATH=posts
MEDIA_PATH=media
```

Point it at a scratch repository while you experiment. Every save is a real
commit, and there is no undo beyond `git revert`.
