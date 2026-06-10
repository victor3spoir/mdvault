# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-06-10
### ✅ Features
- Added TanStack Start article table of contents with sticky navigation.
- Added inline code support to the MDX editor toolbar.
- Added migrated Settings panels for GitHub repository, authentication, and site configuration.

### 🛠 Fixes
- Added TanStack Start root error and not-found screens.
- Fixed article table-of-contents visibility by deriving it from markdown content instead of DOM timing.
- Fixed CMS article TOC sticky behavior by allowing visible overflow in the CMS inset layout.

### 🔧 Chores
- Formatted the TanStack app with Biome so `bun run check` passes.

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
