---
title: Develop
description: Run MDVault from source, find your way around the code, and ship a change.
order: 30
---

## Getting it running

```bash
git clone https://github.com/victor3spoir/mdvault
cd mdvault/mdvault
bun install
cp ../example.env .env.local
bun run dev
```

The app is at **http://localhost:3000**. Fill `.env.local` with a token, an
owner and a repository — see [Configuration](/docs/getting-started/configuration).
Point it at a scratch repository: every save is a real commit.

## Scripts

| Command | What it does |
|---|---|
| `bun run dev` | Dev server on port 3000 |
| `bun run generate-routes` | Regenerates the route tree after adding a route file |
| `bun run build` | Production build, Nitro output in `.output/` |
| `bun run preview` | Serves the build locally |
| `bun run test` | Vitest, once |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run check` | Biome lint and format check |

Run `typecheck`, `check` and `test` before pushing. They are quick and they are
what CI runs.

## Layout

```
mdvault/src/
├── routes/          # file-based routes; the tree is generated
├── features/        # one folder per domain
│   ├── articles/    # schema, server, queries, functions, components
│   ├── posts/
│   ├── vault/
│   ├── media/
│   ├── content/     # the shared content store
│   ├── dashboard/
│   ├── settings/
│   └── shared/      # filters, revisions, translations
├── components/      # shared UI and shadcn primitives
├── integrations/    # GitHub client and env
├── hooks/
└── lib/             # path safety, sanitizing, security middleware
```

Inside a feature the suffix tells you where code runs:

| Suffix | Runs where |
|---|---|
| `.schema.ts` | Zod validation, both sides |
| `.server.ts` | Server only — never import from a component |
| `.functions.ts` | Server functions, the client-callable boundary |
| `.queries.ts` | TanStack Query options |
| `.types.ts` | Types |

`.server.ts` files reach GitHub with the token. Keeping that boundary clean is
what keeps the token out of the bundle.

## The content store

Articles, posts and vault assets share one implementation in
`features/content/content-store.server.ts`. A kind supplies its label, its
commit noun, its root folder and three converters — to a document, to
frontmatter, to a new document. List, get, create, update, delete and publish
come from the store.

Adding a fourth content kind means writing a `ContentKind`, not another CRUD
layer. Fixing a bug in conflict detection fixes it for all of them.

## Conventions

- Biome, with **tabs** and **double quotes**. Run `bun run check` rather than
  arguing with it.
- Imports use the `#/` alias for `src/`.
- Route files are generated into the tree; run `generate-routes` after adding
  one.
- Tests sit next to the code they cover, as `*.test.ts`.

## Adding a route

1. Create the file under `src/routes/`.
2. Run `bun run generate-routes`.
3. If it is a content list, reuse the shared filter schema so search state lands
   in the URL like everywhere else.

## Working on the documentation

The docs site is a separate project — see
[Write the docs](/docs/guides/write-the-docs).
