import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, type Plugin } from "vite";

/**
 * Dev-only: let API routes answer image requests.
 *
 * Vite's dev server short-circuits any request whose `Sec-Fetch-Dest` marks it
 * as a static asset (`image`, `script`, `style`, `font`) and answers 404 before
 * the router is reached. The media proxy is requested by `<img>` tags, so it
 * would never run in development - production is unaffected.
 */
function allowApiAssetRequests(): Plugin {
	return {
		name: "mdvault-allow-api-asset-requests",
		apply: "serve",
		configureServer(server) {
			server.middlewares.use((req, _res, next) => {
				if (req.url?.startsWith("/api/")) {
					req.headers["sec-fetch-dest"] = "empty";
				}
				next();
			});
		},
	};
}

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		allowApiAssetRequests(),
		devtools(),
		nitro({ rollupConfig: { external: [/^@sentry\//] } }),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		babel({ presets: [reactCompilerPreset()] }),
	],
});

export default config;
