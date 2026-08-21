import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsCopyPage } from "#/features/docs/components/docs-copy-page";
import { DocsMarkdown } from "#/features/docs/components/docs-markdown";
import { DocsPager } from "#/features/docs/components/docs-pager";
import { DocsToc } from "#/features/docs/components/docs-toc";
import { docsPageQueryOptions } from "#/features/docs/docs.queries";

export const Route = createFileRoute("/$")({
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(
			docsPageQueryOptions(params._splat ?? ""),
		),
	head: ({ loaderData }) =>
		loaderData
			? {
					meta: [
						{ title: `${loaderData.frontmatter.title} · Documentation` },
						{
							name: "description",
							content: loaderData.frontmatter.description,
						},
					],
				}
			: {},
	notFoundComponent: DocsNotFound,
	component: DocsPage,
});

function DocsPage() {
	const { _splat } = Route.useParams();
	const { data: page } = useSuspenseQuery(docsPageQueryOptions(_splat ?? ""));

	return (
		<div className="flex gap-10 py-14 pb-24">
			<article className="min-w-0 max-w-3xl flex-1">
				<div className="flex items-start justify-between gap-4">
					<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
						{page.frontmatter.title}
					</h1>

					<DocsCopyPage
						source={page.source}
						title={page.frontmatter.title}
						slug={page.slug}
					/>
				</div>

				<p className="mt-4 mb-10 text-lg leading-relaxed text-muted-foreground">
					{page.frontmatter.description}
				</p>

				{/**
				 * `prose` comes from @tailwindcss/typography; the code fences opt out
				 * with `prose-pre:*` because they are already styled by the
				 * highlighter theme and by DocsCodeBlock.
				 */}
				<div className="prose prose-zinc max-w-none dark:prose-invert prose-pre:m-0 prose-pre:border-0 prose-pre:bg-transparent prose-pre:p-0 prose-headings:scroll-mt-20 prose-headings:font-semibold prose-headings:tracking-tight prose-a:font-normal prose-a:underline-offset-4">
					<DocsMarkdown
						document={page.document}
						highlighted={page.highlighted}
					/>
				</div>

				<DocsPager previous={page.previous} next={page.next} />
			</article>

			<aside className="sticky top-20 hidden h-fit w-56 shrink-0 xl:block">
				<DocsToc headings={page.headings} />
			</aside>
		</div>
	);
}

/**
 * A 404 in docs usually means a renamed page, so the recovery offered is the
 * search dialog and the index — not a generic apology.
 */
function DocsNotFound() {
	return (
		<div className="mx-auto w-full max-w-3xl py-24">
			<p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
				404
			</p>
			<h1 className="mt-3 text-3xl font-semibold tracking-tight">
				This page does not exist
			</h1>
			<p className="mt-4 text-muted-foreground">
				It may have been renamed or moved. Press{" "}
				<kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
					Ctrl K
				</kbd>{" "}
				to search, or start again from the{" "}
				<Link to="/" className="underline underline-offset-4">
					documentation index
				</Link>
				.
			</p>
		</div>
	);
}
