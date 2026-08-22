import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { ThemeProvider } from "#/integrations/theme";
import type { RouterContext } from "#/router";
import { docsConfig } from "../../content/docs/docs.config";

import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<RouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: docsConfig.marketing.metaTitle },
			{ name: "description", content: docsConfig.description },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/favicon.ico", sizes: "48x48" },
			{ rel: "icon", href: "/logo192.png", type: "image/png", sizes: "192x192" },
			{ rel: "apple-touch-icon", href: "/logo192.png" },
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument() {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<ThemeProvider>
					<Outlet />
				</ThemeProvider>
				<Scripts />
			</body>
		</html>
	);
}
