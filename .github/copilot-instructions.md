# MDVault Copilot Instructions

AI agents guide for productive contributions to MDVault codebase.

## Project Overview

**MDVault** is a GitHub-powered Markdown CMS built with Next.js 16, React 19, and TypeScript. All content (articles, images, metadata) is stored directly in GitHub as the single source of truth. The app uses GitHub API (Octokit) for all persistence operations—no separate backend database.

**Key Architecture**: App Router (RSC by default) → Feature-based structure → Server Actions → GitHub API

## Architecture & Data Flow

### Article Storage Model
- **File Format**: `articles/{UUID}.md` with YAML frontmatter (gray-matter)
- **Frontmatter Fields**: `title`, `description`, `published`, `lang` ("fr" | "en"), `tags`, `coverImage`, `createdAt`, `updatedAt`, `publishedDate`, `author`
- **ID System**: Uses `crypto.randomUUID()` per article (embedded in filename, not slug)
- **Bilingual Support**: Articles tagged with `lang: "fr"` or `lang: "en"` for filtering/display

### Feature Structure
```
features/
  articles/          # Core article CRUD (types, actions, utils, validation)
    articles.types.ts         # Article, ArticleFrontmatter types
    articles.actions.ts       # Server actions (create, update, delete, list, publish)
    articles.utils.ts         # Frontmatter parsing/generation, word count
    articles.search-params.ts # URL params (status, tags, lang filters)
    components/               # All article UI (card, editor, dialogs)
  medias/            # Image management (upload, gallery, usage tracking)
  dashboard/         # Activity/analytics
  shared/            # Reusable types, components, utils
```

### Server Actions Pattern
All data mutations use server actions in `features/{domain}/{domain}.actions.ts`:
- Accept validated input
- Return `ActionResult<T>` type (success/error wrapper)
- Use `cacheTag()` / `updateTag()` for cache invalidation
- Call GitHub API via Octokit (`/lib/octokit.ts`)
- Example: `createArticleAction()` → validates → generates UUID → commits to GitHub

### Filtering & Search
- URL-based state via `nuqs` library (query string sync)
- Search params in `articles.search-params.ts` define filters: `searchQuery`, `status` ("all"|"published"|"draft"), `tags[]`, `lang` ("all"|"en"|"fr"), `sortBy`, `sortOrder`
- Filter logic in page component (not components) - see `/app/cms/articles/page.tsx`

## Development Workflow

### Running the Project
```bash
bun run dev        # Start Next.js dev server
bun run build      # Production build (Turbopack enabled)
bun run lint       # Biome linter + formatter
bun run format     # Code formatting only
```

### Key Commands
- **Lint** enforces Biome rules and Tailwind best practices
- **Build** compiles with TypeScript strict mode enabled
- **Unused imports**: Automatically fixed by lint (remove dead code)

## Code Patterns & Conventions

### Types & Validation
- **Zod schemas** in `/lib/validation/{domain}.schema.ts` for runtime validation
- **Type imports**: `import type { Article }` (use `type` keyword)
- **Props wrapper**: `Readonly<Props>` for component props (strict type safety)
- Always validate server action input: `const input = CreateArticleSchema.parse(data)`

### Article Management
- **ID-based routing**: Routes use `[id]` not `[slug]` → `/cms/articles/{uuid}` and `/cms/articles/{uuid}/edit`
- **State consolidation**: Complex UI state (modals, loading, collapse) uses single object (`EditorUIState`)
- **useTransition for async**: All async operations use `useTransition()` hook—no manual loading booleans
- **Language**: Always include `lang` field in article frontmatter (default: "en")

### Component Patterns
- **Server by default**: Pages and layouts are server components
- **"use client" sparingly**: Only add for interactivity (forms, modals, dialogs, hooks)
- **UI State in components**: Use `useState`, `useTransition` for client interactions
- **Server Actions in components**: Import and call directly from `features/{domain}/{domain}.actions.ts`

### Styling
- **Tailwind CSS** with dark mode support (next-themes)
- **shadcn/ui components** for consistent design (Button, Select, Badge, Card, etc.)
- **Icons**: `@tabler/icons-react` (e.g., `IconEdit`, `IconLanguage`)
- **Responsive**: Mobile-first (`sm:`, `md:` breakpoints)

### Image Handling
- **next/image** for optimization (local and remote)
- **Remote patterns**: GitHub raw content (`raw.githubusercontent.com`) and picsum.photos
- **Upload flow**: Via ImageUploader → uploadImageAction → GitHub media directory
- **Media tracking**: `medias.actions.ts` tracks which articles use which images

## Important Gotchas & Patterns

### GitHub API Integration
- All article reads/writes go through Octokit
- **File SHA required for updates/deletes** (GitHub's optimistic locking)
- `fetchLatestSha()` before updating to avoid conflicts
- Cache invalidation: use `updateTag('articles')` after mutations

### Article Editor
- Removed slug-based identification (now uses UUID)
- Language selector in sidebar (`article-editor-settings-sidebar.tsx`)
- Cover image preview in sidebar (`cover-image-selector.tsx`)
- MDX editor via `@mdxeditor/editor` with custom toolbar

### Search & Filtering
- **In-memory filtering**: All articles fetched, filtered client-side in server component
- **URL-based persistence**: Filters sync to URL via `nuqs` → bookmarkable/shareable
- **Language filter**: New in v0.1.0 → `lang: "all" | "en" | "fr"` in search params

### Build & Cache
- **Next.js 16 with Cache Components enabled** (`cacheComponents: true`)
- **Turbopack** for faster compilation
- **Static optimization**: Pre-renders routes where possible
- `updateTag('articles')` invalidates article-related cached pages

## File Locations Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| Article types | `features/articles/articles.types.ts` | Article, Frontmatter interfaces |
| Article actions | `features/articles/articles.actions.ts` | CRUD server actions |
| Validation | `lib/validation/article.schema.ts` | Zod schemas for input validation |
| UI Components | `features/articles/components/` | Card, editor, dialogs, search |
| Search params | `features/articles/articles.search-params.ts` | nuqs filter definitions |
| GitHub client | `lib/octokit.ts` | Octokit instance & repo config |
| Utilities | `features/articles/articles.utils.ts` | Frontmatter parsing, word count |

## Common Tasks

### Add a new article field
1. Update `ArticleFrontmatter` in `articles.types.ts`
2. Update `CreateArticleSchema` in `lib/validation/article.schema.ts`
3. Update `generateFrontmatter()` in `articles.utils.ts` to handle field
4. Update `parseFrontmatter()` to extract field with proper default
5. Add UI control in editor sidebar component

### Add a new filter
1. Add filter type to `articles.search-params.ts` (e.g., `const statusFilters = [...]`)
2. Add to `articlesSearchParams` object with `parseAsStringLiteral` or `parseAsArrayOf`
3. Import `LangFilter` type in search bar component
4. Add Select/Dropdown UI in `article-search-bar.tsx`
5. Add filter logic in `/app/cms/articles/page.tsx` (matchesFilter check)

### Deploy to production
```bash
npm run build    # Verify build succeeds (Next.js + TypeScript checks)
npm run lint     # Check linting
# Commit & push to deploy (vercel/github-actions workflow)
```

## Environment Setup

Required `.env` variables (see `example.env`):
- `GITHUB_OWNER`: GitHub username or org
- `GITHUB_REPO`: Repository name for content
- `GITHUB_TOKEN`: Personal access token (requires repo access)
- `NEXT_PUBLIC_*`: Any public env vars (accessible in browser)

## External Dependencies

| Package | Purpose | Notes |
|---------|---------|-------|
| `@octokit/rest` | GitHub API client | Auth via token, call before render |
| `gray-matter` | YAML frontmatter parsing | Handles article metadata extraction |
| `@mdxeditor/editor` | Rich markdown editor | Custom toolbar, live preview |
| `nuqs` | URL search params | Type-safe query string syncing |
| `sonner` | Toast notifications | Toast.success/error after actions |
| `shadcn/ui` | Component library | Pre-built accessible UI (Button, Select, etc.) |
| `next-themes` | Dark mode | Integrates with Tailwind dark: modifier |

---

**Last Updated**: Feb 2026  
**Maintained by**: Agent Framework  
**See Also**: `.github/instructions/nextjs.instructions.md` for base Next.js conventions
