# MDVault application

This directory contains the MDVault web application: a GitHub-backed Markdown CMS built with TanStack Start and React 19.

## Security model

MDVault has **no application login, user accounts, or in-app authentication**. The configured `GITHUB_TOKEN` is a server-side credential used only for GitHub API operations; it is not a credential for people accessing the interface.

Restrict access at deployment time. Run MDVault on a trusted network or behind firewall, VPN, or reverse-proxy access controls. Do not expose it directly to the public internet.

## Requirements

- [Bun](https://bun.com/) for development and production
- A GitHub repository for content
- A GitHub personal access token with read/write access to that repository

## Configuration

Create `.env.local` in this directory:

```dotenv
GITHUB_TOKEN=<your_github_token>
GITHUB_OWNER=<your_github_user_or_organization>
GITHUB_REPO=<your_content_repository>

# Optional repository paths
ARTICLES_PATH=articles
POSTS_PATH=posts
MEDIA_PATH=media
```

Prefer a fine-grained token limited to the content repository with **Contents: Read and write** and **Metadata: Read-only** permissions.

## Development commands

Run all commands from this directory:

```bash
bun install --frozen-lockfile
bun run dev             # Development server on port 3000
bun run check           # Biome checks
bun run typecheck       # TypeScript typecheck
bun run test            # Vitest test suite
bun run build           # Production build
```

The development server is available at [http://localhost:3000](http://localhost:3000).

## Preview and production

Build first, then use Vite's preview server to inspect the result locally:

```bash
bun run build
bun run preview
```

Nitro writes the production server to `.output/server/index.mjs`. Run that output directly with Bun:

```bash
HOST=127.0.0.1 PORT=3000 bun .output/server/index.mjs
```

The output is also Node-compatible:

```bash
HOST=127.0.0.1 PORT=3000 node .output/server/index.mjs
```

## Docker

Build the application image from this directory:

```bash
docker build -t mdvault .
```

Bind the published port to loopback by default:

```bash
docker run -d \
  --name mdvault \
  -p 127.0.0.1:3000:3000 \
  -e GITHUB_TOKEN=your_token \
  -e GITHUB_OWNER=your_username \
  -e GITHUB_REPO=your_repo \
  --restart unless-stopped \
  mdvault
```

The container listens on `0.0.0.0:3000` internally so Docker can route traffic to it. The host-side `127.0.0.1:3000` binding keeps the application private to the host and works with a reverse proxy running there.

## Architecture

- **TanStack Start** provides the full-stack React framework and server functions.
- **React 19** renders the application UI.
- **TanStack Router** provides file-based routing and SSR.
- **TanStack Query** manages server state with router SSR integration.
- **Vite** provides development and build tooling.
- **Nitro** produces the deployable server under `.output/`.
- **Octokit** reads and writes Markdown and media in the configured GitHub repository.
- **Tailwind CSS** and shadcn/ui provide the styling foundation.

Routes live in `src/routes/`, feature code lives in `src/features/`, and shared UI lives in `src/components/`.
