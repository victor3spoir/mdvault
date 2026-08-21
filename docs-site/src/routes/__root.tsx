import { IconMenu2 } from "@tabler/icons-react";
import { HotkeysProvider, useHotkey } from "@tanstack/react-hotkeys";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "#/components/ui/sheet";
import { DocsSearchDialog } from "#/features/docs/components/docs-search";
import {
	DocsSidebar,
	ShortcutBadge,
} from "#/features/docs/components/docs-sidebar";
import { docsNavQueryOptions } from "#/features/docs/docs.queries";
import { ThemeProvider, ThemeToggle } from "#/integrations/theme";
import type { RouterContext } from "#/router";
import { docsConfig } from "../../content/docs/docs.config";

import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<RouterContext>()({
	/**
	 * The navigation is fetched once for the whole section and cached forever —
	 * it can only change with a new deploy. Loading it in the layout rather than
	 * per page means moving between pages never re-renders the sidebar.
	 */
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(docsNavQueryOptions()),
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: `${docsConfig.title} · ${docsConfig.siteName}` },
			{ name: "description", content: docsConfig.description },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	shellComponent: RootDocument,
});

/**
 * The whole site *is* the documentation, so the HTML shell and the docs layout
 * are one component — there is no product chrome to sit above it.
 */
function RootDocument() {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<ThemeProvider>
					<DocsLayout />
				</ThemeProvider>
				<Scripts />
			</body>
		</html>
	);
}

function DocsLayout() {
	const { data: nav } = useSuspenseQuery(docsNavQueryOptions());
	const [searchOpen, setSearchOpen] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<HotkeysProvider>
			<DocsHotkeys onOpenSearch={() => setSearchOpen(true)} />

			<div className="min-h-svh bg-background">
				<header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
					<div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6">
						<Sheet open={menuOpen} onOpenChange={setMenuOpen}>
							<SheetTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									aria-label="Open navigation"
									className="lg:hidden"
								>
									<IconMenu2 className="size-5" />
								</Button>
							</SheetTrigger>

							<SheetContent
								side="left"
								className="w-[320px] overflow-y-auto p-4"
							>
								<SheetHeader className="p-0">
									<SheetTitle className="sr-only">Documentation</SheetTitle>
								</SheetHeader>

								<DocsSidebar
									nav={nav}
									onOpenSearch={() => {
										setMenuOpen(false);
										setSearchOpen(true);
									}}
									onNavigate={() => setMenuOpen(false)}
								/>
							</SheetContent>
						</Sheet>

						<Link to="/" className="flex items-center gap-2.5">
							<span className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
								{docsConfig.siteName.slice(0, 1)}
							</span>
							<span className="text-sm font-semibold tracking-tight">
								{docsConfig.siteName}
							</span>
						</Link>

						<div className="ml-auto flex items-center gap-2">
							<button
								type="button"
								onClick={() => setSearchOpen(true)}
								aria-label="Search docs"
								className="hidden items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground lg:flex"
							>
								Search
								<ShortcutBadge />
							</button>

							<ThemeToggle />

							{docsConfig.appUrl ? (
								<Button asChild size="sm">
									<a href={docsConfig.appUrl}>Open app</a>
								</Button>
							) : null}
						</div>
					</div>
				</header>

				<div className="mx-auto flex w-full max-w-[1400px] px-4 sm:px-6">
					<aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-[280px] shrink-0 overflow-y-auto lg:block">
						<DocsSidebar nav={nav} onOpenSearch={() => setSearchOpen(true)} />
					</aside>

					<div className="min-w-0 flex-1 lg:pl-10">
						<Outlet />
					</div>
				</div>
			</div>

			<DocsSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
		</HotkeysProvider>
	);
}

function DocsHotkeys({ onOpenSearch }: { onOpenSearch: () => void }) {
	useHotkey("Mod+K", onOpenSearch, { preventDefault: true });
	useHotkey("/", onOpenSearch, { preventDefault: true });

	return null;
}
