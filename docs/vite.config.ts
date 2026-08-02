import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { defineConfig, type Plugin } from "vite";

const require = createRequire(import.meta.url);

/**
 * Absolute URL of the deployed site, needed by canonical/OpenGraph tags,
 * robots.txt and the sitemap.
 *
 * Vercel sets these automatically, so production and preview deployments are
 * both correct without configuration. Set `SITE_URL` once a custom domain is
 * attached.
 */
function resolveSiteUrl() {
	const host =
		process.env.SITE_URL ??
		process.env.VERCEL_PROJECT_PRODUCTION_URL ??
		process.env.VERCEL_URL;

	if (!host) {
		return "https://mdvault-docs.vercel.app";
	}

	return (host.startsWith("http") ? host : `https://${host}`).replace(
		/\/$/,
		"",
	);
}

/** Fills in `%SITE_URL%` placeholders and emits the SEO files. */
function siteUrlPlugin(siteUrl: string): Plugin {
	return {
		name: "mdvault-site-url",
		transformIndexHtml(html) {
			return html.replaceAll("%SITE_URL%", siteUrl);
		},
		generateBundle() {
			this.emitFile({
				type: "asset",
				fileName: "robots.txt",
				source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
			});

			this.emitFile({
				type: "asset",
				fileName: "sitemap.xml",
				source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>${siteUrl}/</loc>
		<lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>1.0</priority>
	</url>
</urlset>
`,
			});
		},
	};
}

/**
 * Inlines Tabler icons at build time.
 *
 * Writing `<i data-icon="brand-github"></i>` in the HTML is replaced by the
 * icon's SVG markup, so the page gains icons without shipping a single byte of
 * JavaScript or a webfont request.
 */
function tablerIconsPlugin(): Plugin {
	// The package only exports `./icons/*`, so the directory is derived from a
	// known icon rather than from its package.json.
	const iconsDir = dirname(
		dirname(require.resolve("@tabler/icons/outline/brand-github.svg")),
	);
	const cache = new Map<string, string>();

	function loadIcon(name: string, variant: "outline" | "filled") {
		const key = `${variant}/${name}`;
		const cached = cache.get(key);
		if (cached) {
			return cached;
		}

		let svg: string;
		try {
			svg = readFileSync(join(iconsDir, variant, `${name}.svg`), "utf8");
		} catch {
			throw new Error(`Unknown Tabler icon "${name}" (${variant})`);
		}

		const inlined = svg
			.replace(/\s+/g, " ")
			.replace(/class="[^"]*"/, 'class="icon" aria-hidden="true"')
			.trim();

		cache.set(key, inlined);
		return inlined;
	}

	return {
		name: "mdvault-tabler-icons",
		transformIndexHtml(html) {
			return html.replace(
				/<i\s+data-icon="([a-z0-9-]+)"(?:\s+data-variant="(outline|filled)")?\s*>\s*<\/i\s*>/g,
				(_match, name: string, variant?: string) =>
					loadIcon(name, (variant as "outline" | "filled") ?? "outline"),
			);
		},
	};
}

export default defineConfig({
	plugins: [tablerIconsPlugin(), siteUrlPlugin(resolveSiteUrl())],
	build: {
		rollupOptions: {
			input: {
				index: "index.html",
				404: "404.html",
			},
		},
	},
});
