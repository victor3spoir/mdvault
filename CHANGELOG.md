# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-08-22

### Features
- Added article and Vault translations: link content across languages from a translations section in the editor, with locale flags and language filters on every list.
- Added content language settings so each vault defines which locales it publishes in.
- Added Mermaid diagram rendering in articles and previews, plus HCL syntax highlighting.
- Added slash commands (`/`) in the editor for inserting headings, lists, tables, images, callouts, video embeds and more.
- Added callout blocks (note, tip, warning, etc.) round-tripped to plain Markdown.
- Added YouTube and Vimeo video embeds in articles.
- Added find & replace inside the editor.
- Added a document outline panel for jumping between headings.
- Added drag-handle block reordering and keyboard block move commands.
- Added paste cleanup: pasted HTML and text are normalised into clean Markdown-friendly content.
- Added content checks (missing alt text, empty headings and similar issues) surfaced in a popover before publishing.
- Added checklist (task list) support to the rich text editor.
- Added a toggle between the rich editor and the raw Markdown source.
- Added TOML and TSX to the code block language picker.
- Accepted SVG uploads, optimised images on upload and allowed media downloads.
- Served images through an `/api/media` proxy.
- Launched the new documentation site (`docs-site/`): marketing landing page, `/docs` documentation and a `/changelog` page.

### Fixes
- Stopped the breadcrumb overflowing its header.
- Kept plain-text posts free of markdown artefacts.
- Made preview and settings panels mutually exclusive in the editor.
- Aligned code blocks and tables consistently between the editor and the rendered page.
- Polished the site header, theme toggle and editor title input.

### Refactors
- Centralised post-mutation refresh logic.
- Tightened the article and asset type grids and dropped dead style rules in favour of theme tokens.
- Removed dead code and unused dependencies.

## [1.1.0] - 2026-08-02

### Features
- Replaced the MDX editor with a Tiptap rich-text editor: tables, images, code blocks with a per-block language picker, and syntax highlighting while typing.
- Added a live split preview that renders with the same pipeline as the published page.
- Added user-defined content types ("Vault"): declare a type in Settings and it gets its own repository folder, sidebar entry, list, editor and cards.
- Added a command palette (Cmd/Ctrl + K) for jumping to any article, post or custom asset.
- Added autosave with local draft recovery across refreshes and crashes.
- Added image display controls (25-100% width, left/center/right alignment) persisted inside plain Markdown.
- Added a plain-text editor for posts, enforced by the editor schema rather than by disabling buttons.
- Added shared search, status, language and tag filtering across every content list, with state kept in the URL.
- Redesigned the dashboard around per-section metrics, with a log-style recent-activity table.
- Added media upload compression, copy-as-URL/Markdown, and usage checks before deletion.

### Security
- Replaced `gray-matter` with a hardened frontmatter parser: YAML alias-expansion bombs are rejected and metadata blocks are size-capped, closing an unauthenticated denial-of-service path.
- Fixed the rate limiter: `X-Forwarded-For` is now only trusted behind `TRUSTED_PROXY`, and expired entries are swept under a bounded key ceiling.
- Added runtime validation to the media server functions that previously accepted unvalidated input.
- Added a Content-Security-Policy and a `Sec-Fetch-Site` check on writes, alongside the existing CSRF tokens.
- Made vault type creation write its sha-guarded config before creating the folder, so a failure leaves a repairable state.
- Resolved all dependency advisories; `bun audit` reports no vulnerabilities.

### Accessibility & motion
- Added a global `prefers-reduced-motion` guard.
- Added press feedback to every button and gated hover-only motion behind fine pointers.
- Replaced unbounded `transition-all` with explicit property lists across the app.

### Refactors
- Consolidated the triplicated article/post/vault content engines into a single content store, removing roughly 900 lines.
- Added a shared GitHub file layer with bounded concurrency and short-lived listing caches, cutting the API calls behind each page load.
- Replaced browser `confirm()` prompts with accessible alert dialogs.

### Documentation
- Added a static documentation site (`docs/`, Vite + Bun) ready to deploy on Vercel.
- Added an architecture diagram and refreshed every application screenshot.
- Standardised the project description on "GitHub-powered Markdown content management".

## [1.0.0] - 2026-02-27
### ✅ Features
- Introduced hybrid media cache with request queue; images fetch on-demand from GitHub and convert to Blob URLs (commit fd73ef2).

### ✅ Closed Issues
- Added token permissions documentation (#11).
- Environment variable documentation improvements referenced issue #5.

## [0.1.2]
### 🛠 Fixes
- Corrected CI/CD error and cleaned pipeline (commit d3aee49).

## [0.1.1]
### ✨ Features
- Updated CI/CD workflow with enhanced linting and security scans (commit 8ad68b5).

## [0.1.0]
### ⚙️ Initial Release
- Launched baseline CMS with dark mode, environment docs, and CI improvements.

### 🛠️ Fixes
- Fixed media display and resolved concurrent overload issues (commit 0f3669c).
- Enabled CodeMirror syntax highlighting for MDX editor code blocks (commit 5f90a25).
- Dark mode MDXEditor styling improvements: image toolbar, language selector dropdown, loading layout (commit 6d899ff).
- Post editor article combobox now displays correct title (commit 580f623).
- Various CI/CD and Docker build configuration fixes (commits ab16155, d46ed82, etc).
- Updated editor config & cleaned cache hook; removed diagnostics page (commit c8d6be2).
- Cleanup of unused dependencies and example code (commit 3f0be43).

### ⚡ Performance
- Replaced data: URLs with Blob URLs for improved image rendering (commit 39fe84d).

### 🔧 Chores
- Updated bun.lock after dependency changes.
- Removed unused `next-mdx-remote` package and example components/files.
- Finalized media actions and cache hook after debugging.
- CI pipeline rewritten with lint/security scans.

*This release marks the first stable, production-ready version of MDVault.*

---
