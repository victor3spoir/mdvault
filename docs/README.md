# MDVault documentation site

The public site for [MDVault](https://github.com/victor3spoir/mdvault) —
GitHub-powered Markdown content management. A single static page built with
Vite.

## Local development

```bash
bun install
bun run dev       # dev server with hot reload
bun run build     # build into dist/
bun run preview   # serve the built dist/
```

## Deploying to Vercel

`vercel.json` holds the build settings, so the only thing to configure in the
Vercel dashboard is:

| Setting | Value |
|---|---|
| **Root Directory** | `docs` |

Or from the CLI:

```bash
cd docs
bunx vercel --prod
```

### Site URL

Canonical, OpenGraph, `robots.txt` and `sitemap.xml` need an absolute URL.
`vite.config.ts` resolves it in this order:

1. `SITE_URL` — set this once you have a custom domain
2. `VERCEL_PROJECT_PRODUCTION_URL` — set automatically by Vercel
3. `VERCEL_URL` — preview deployments
4. `https://mdvault.vercel.app` — local fallback

Production and preview deployments are therefore correct out of the box. After
attaching a custom domain, add `SITE_URL=https://your-domain.com` to the
project's environment variables.

## Structure

| Path | Purpose |
|---|---|
| `index.html` | Page structure and copy |
| `404.html` | Not-found page, served automatically by Vercel |
| `styles.css` | All styling, light/dark via `prefers-color-scheme` |
| `vite.config.ts` | Build config + plugins for `%SITE_URL%`, robots/sitemap and icons |
| `public/screenshots/` | App screenshots used in the "Inside the app" section |
| `public/diagrams/` | Architecture diagram (`.excalidraw` source + `.png`) |
| `public/og-image.png` | Social preview image |

Anything in `public/` is copied to the site root untouched, so its URLs stay
stable and can be linked to directly. Everything else is bundled and
fingerprinted into `assets/`.

`%SITE_URL%` placeholders in the HTML are replaced at build time; leave them as
they are.

## Icons

Icons come from [Tabler](https://tabler.io/icons) and are inlined at build time,
so the page still ships almost no JavaScript. Write:

```html
<i data-icon="brand-github"></i>
<i data-icon="star" data-variant="filled"></i>
```

The name is the icon's file name in `@tabler/icons`. `data-variant` is optional
and defaults to `outline`. An unknown name fails the build rather than silently
rendering nothing.

Icons inherit `currentColor` and are sized in `em`, so they follow the text they
sit next to. Use `.card__icon` for the tinted square used on feature cards.

## Theming

The site supports **light**, **dark** and **auto** (follow the operating
system). The toggle in the header cycles through them and the choice is stored
in `localStorage` under `mdvault-theme`.

- `public/theme.js` applies the stored choice by setting `data-theme` on `<html>`.
  It is loaded **synchronously** from `<head>` so the theme is applied before the
  first paint — a deferred or module script would flash the wrong theme.
- `styles.css` defines the palette three times: light on `:root`, dark on
  `:root[data-theme="dark"]`, and dark again inside a `prefers-color-scheme`
  query for the auto case.
- The toggle renders all three icons and CSS shows the one matching
  `data-theme`, so no JavaScript touches the icons.
- The button is `hidden` in the markup and revealed by `theme.js`, so it never
  appears as a dead control when JavaScript is unavailable.
