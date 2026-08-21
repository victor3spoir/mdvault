import { Link, useLocation } from "@tanstack/react-router";
import { DocsIcon } from "#/features/docs/components/docs-icon";
import type { DocsNav } from "#/features/docs/docs.types";
import { cn } from "#/lib/utils";

/**
 * Sidebar: search trigger, top-level entries, then grouped links — in that
 * order and no other. The search trigger sits above navigation because readers
 * who arrive from a search engine or an error message have a phrase in hand,
 * not a mental model of the sidebar.
 */
export function DocsSidebar({
	nav,
	onOpenSearch,
	onNavigate,
}: {
	nav: DocsNav;
	onOpenSearch: () => void;
	onNavigate?: () => void;
}) {
	const { pathname } = useLocation();
	const isActive = (slug: string) => pathname === `/${slug}`;

	return (
		<nav aria-label="Documentation" className="flex flex-col gap-6 py-6 pr-4">
			<SearchTrigger onClick={onOpenSearch} />

			{nav.top.length ? (
				<ul className="flex flex-col gap-0.5">
					{nav.top.map((link) => (
						<li key={link.slug}>
							<Link
								to="/$"
								params={{ _splat: link.slug }}
								onClick={onNavigate}
								className={cn(
									"flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
									isActive(link.slug)
										? "bg-accent font-medium text-accent-foreground"
										: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
								)}
							>
								<DocsIcon name={link.icon} className="size-4 shrink-0" />
								<span className="truncate">{link.title}</span>
							</Link>
						</li>
					))}
				</ul>
			) : null}

			{nav.groups.map((group) => (
				<div key={group.id} className="flex flex-col gap-1">
					<p className="px-3 pb-1 font-mono text-[11px] tracking-[0.14em] text-muted-foreground/80 uppercase">
						{group.label}
					</p>

					<ul className="flex flex-col gap-0.5">
						{group.links.map((link) => (
							<li key={link.slug}>
								<Link
									to="/$"
									params={{ _splat: link.slug }}
									onClick={onNavigate}
									title={link.title}
									className={cn(
										"block truncate rounded-lg px-3 py-1.5 text-sm transition-colors",
										isActive(link.slug)
											? "bg-accent font-medium text-accent-foreground"
											: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
									)}
								>
									{link.title}
								</Link>
							</li>
						))}
					</ul>
				</div>
			))}
		</nav>
	);
}

/**
 * A button, not an input.
 *
 * An inline field that behaves like a button is a trap for keyboard and screen
 * reader users: they focus it, type, and nothing happens where they expect.
 */
function SearchTrigger({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex w-full items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		>
			<span className="flex-1 text-left">Search docs…</span>
			<ShortcutBadge />
		</button>
	);
}

/**
 * Renders a neutral label on the server and resolves the platform after
 * hydration: showing `Ctrl K` to a Mac user is a small lie that reads as
 * carelessness, and resolving it during SSR causes a hydration mismatch.
 */
export function ShortcutBadge({ className }: { className?: string }) {
	return (
		<kbd
			className={cn(
				"rounded border border-border/70 bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground",
				className,
			)}
			suppressHydrationWarning
		>
			{typeof navigator !== "undefined" &&
			/Mac|iPhone|iPad/.test(navigator.platform)
				? "⌘K"
				: "Ctrl K"}
		</kbd>
	);
}
