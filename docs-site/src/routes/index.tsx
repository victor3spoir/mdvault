import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DocsCards } from "#/features/docs/components/docs-cards";
import { docsNavQueryOptions } from "#/features/docs/docs.queries";
import { docsConfig } from "../../content/docs/docs.config";

export const Route = createFileRoute("/")({
	component: DocsHomePage,
});

/**
 * The landing is a directory, not a page of prose.
 *
 * Someone arriving at `/docs` is deciding where to go, so the fastest useful
 * screen is a grid of destinations with one line each. Everything they might
 * actually read lives one click away.
 */
function DocsHomePage() {
	const { data: nav } = useSuspenseQuery(docsNavQueryOptions());

	return (
		<div className="mx-auto w-full max-w-3xl py-14 pb-24">
			<h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
				{docsConfig.title}
			</h1>

			<p className="mt-6 mb-16 max-w-2xl text-lg leading-relaxed text-muted-foreground">
				{docsConfig.landing.lede}
			</p>

			<DocsCards nav={nav} />
		</div>
	);
}
