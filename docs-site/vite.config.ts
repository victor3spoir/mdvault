import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

/**
 * The documentation site is its own Vite application.
 *
 * Nesting a second TanStack Start app inside the product app is not possible:
 * one Vite config owns one route tree, one router generator and one React copy.
 * Keeping `docs-site/` beside the app means it builds, versions and deploys on
 * its own — and can be moved to its own repository with a single `git mv`.
 */
export default defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		nitro(),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		babel({ presets: [reactCompilerPreset()] }),
	],
});
