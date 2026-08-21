import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import type { DocsNavLink } from "#/features/docs/docs.types";

/**
 * Previous / next, in the same order as the sidebar.
 *
 * Documentation is read as a sequence far more often than the navigation
 * suggests; without this, finishing a page is a dead end that sends the reader
 * back to hunt the sidebar for where they were.
 */
export function DocsPager({
	previous,
	next,
}: {
	previous?: DocsNavLink;
	next?: DocsNavLink;
}) {
	if (!previous && !next) return null;

	return (
		<nav
			aria-label="Pagination"
			className="mt-16 grid gap-3 border-t pt-8 sm:grid-cols-2"
		>
			{previous ? (
				<PagerLink link={previous} direction="previous" />
			) : (
				<span className="hidden sm:block" />
			)}
			{next ? <PagerLink link={next} direction="next" /> : null}
		</nav>
	);
}

function PagerLink({
	link,
	direction,
}: {
	link: DocsNavLink;
	direction: "previous" | "next";
}) {
	const isNext = direction === "next";

	return (
		<Link
			to="/$"
			params={{ _splat: link.slug }}
			className={`group flex flex-col gap-1 rounded-xl border p-4 transition-colors hover:border-foreground/30 hover:bg-accent/40 ${
				isNext ? "sm:items-end sm:text-right" : ""
			}`}
		>
			<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
				{isNext ? null : <IconArrowLeft className="size-3.5" />}
				{isNext ? "Next" : "Previous"}
				{isNext ? <IconArrowRight className="size-3.5" /> : null}
			</span>
			<span className="text-sm font-medium">{link.title}</span>
		</Link>
	);
}
