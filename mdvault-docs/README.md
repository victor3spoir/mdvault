# MDVault documentation

Product website and documentation for MDVault. It is a **separate TanStack
Start project**: `/` presents the product and `/docs` contains the searchable
documentation. It installs, builds and deploys on its own, and nothing in
`src/` imports from the app next door.

## Run it

```bash
cd mdvault-docs
bun install
bun run dev        # http://localhost:3100
```

| Script | Does |
|---|---|
| `bun run dev` | Dev server on port 3100 |
| `bun run build` | Nitro output in `.output/` |
| `bun run preview` | Serve the built output |
| `bun run generate-routes` | Regenerate `src/routeTree.gen.ts` |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run check` | Biome |

No environment variables are required. The docs are public and read no database.

## Release notes and screenshots

Keep `content/changelog.ts` aligned with the root `CHANGELOG.md`. Use an
**Unreleased** entry without a date while preparing a release; assign a version
and date only when that release is decided. Do not rewrite published history.

Product captures live in `public/screenshots/`, with matching copies in the
repository's `images/screenshots/` for the README. Current captures use a
1440 × 1000 viewport, the light theme, and the app prepared for v1.3.0.
Capture dialogs before confirmation; do not publish, delete or move content
to make a screenshot.

## Write a page

Drop a `.md` file under `content/docs/<section>/`, with frontmatter:

```md
---
title: Page title
description: One sentence shown in search and on cards.
order: 20
---
```

The sidebar is derived from the file tree plus that frontmatter — there is no
second nav list to maintain. Sections and their order live in
`content/docs/docs.config.ts`, along with the documentation card groups,
homepage mode and the "edit this page" link.

Set `homepage` to `landing`, `docs` or `changelog` to choose what appears at
`/`. Documentation remains available at `/docs`.

Fenced blocks are highlighted; a `mermaid` fence renders as a diagram.

## Deploy it

Point the host at `mdvault-docs/` as project root, build with `bun run build`, and
serve `.output/`. It is a standard Nitro build, so any Node host works.

To move the docs into their own repository:

```bash
git mv mdvault-docs ../otapp-docs
cd ../otapp-docs && git init
```

Nothing else changes — that independence is deliberate. Cross-links back to the
product are absolute URLs configured as `appUrl` in `docs.config.ts`.
