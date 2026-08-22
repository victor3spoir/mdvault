import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DocsCards } from "#/features/docs/components/docs-cards";
import { docsNavQueryOptions } from "#/features/docs/docs.queries";
import { docsConfig } from "../../../content/docs/docs.config";

export const Route = createFileRoute("/docs/")({
	component: DocsHomePage,
});

function DocsHomePage() {
	const { data: nav } = useSuspenseQuery(docsNavQueryOptions());

	return (
		<div className="mx-auto w-full max-w-4xl py-14 pb-24">
			<p className="text-sm font-medium text-brand">MDVault guides</p>
			<h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
				{docsConfig.title}
			</h1>

			<p className="mt-6 mb-16 max-w-2xl text-lg leading-relaxed text-muted-foreground">
				{docsConfig.landing.lede}
			</p>

			<DocsCards nav={nav} />
		</div>
	);
}
