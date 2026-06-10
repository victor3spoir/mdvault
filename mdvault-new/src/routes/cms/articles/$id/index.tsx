import { createFileRoute, Link } from "@tanstack/react-router";
import { PageLayout } from "#/components/page-layout";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	articleQueryOptions,
	collectArticleImageSources,
} from "#/features/articles/articles.queries";
import { TableOfContents } from "#/features/articles/components/table-of-contents";
import { MarkdownContent } from "#/features/content/components/markdown-content";
import { PrivateImage } from "#/features/media/components/private-image";
import { prefetchMediaDataUrls } from "#/features/media/media.queries";

export const Route = createFileRoute("/cms/articles/$id/")({
	loader: async ({ context, params }) => {
		const article = await context.queryClient.ensureQueryData(
			articleQueryOptions(params.id),
		);

		if (article) {
			await prefetchMediaDataUrls(
				context.queryClient,
				collectArticleImageSources(article),
			);
		}

		return article;
	},
	component: ArticleDetailPage,
});

function ArticleDetailPage() {
	const article = Route.useLoaderData();

	if (!article) {
		return (
			<PageLayout title="Article Not Found">
				<div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
					The requested article could not be loaded.
				</div>
			</PageLayout>
		);
	}

	return (
		<PageLayout
			title={article.title}
			description={article.description}
			actions={
				<div className="flex items-center gap-2">
					<Button variant="outline" asChild>
						<Link to="/cms/articles">Back</Link>
					</Button>
					<Button asChild>
						<Link to="/cms/articles/$id/edit" params={{ id: article.id }}>
							Edit
						</Link>
					</Button>
				</div>
			}
		>
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
				<div className="space-y-6 lg:col-span-3">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant={article.published ? "default" : "secondary"}>
							{article.published ? "Published" : "Draft"}
						</Badge>
						{article.tags?.map((tag) => (
							<Badge key={tag} variant="outline">
								{tag}
							</Badge>
						))}
					</div>

					<div className="text-sm text-muted-foreground">
						{article.author ? <span>By {article.author}</span> : null}
						{article.author && article.createdAt ? <span> • </span> : null}
						{article.createdAt ? (
							<span>
								Created {new Date(article.createdAt).toLocaleDateString()}
							</span>
						) : null}
						{article.publishedAt ? (
							<span>
								{" "}
								• Published {new Date(article.publishedAt).toLocaleDateString()}
							</span>
						) : null}
					</div>

					{article.coverImage ? (
						<div className="overflow-hidden rounded-2xl border bg-muted">
							<PrivateImage
								src={article.coverImage}
								alt={article.title}
								className="aspect-video w-full object-cover"
							/>
						</div>
					) : null}

					<article className="max-w-none">
						<MarkdownContent source={article.content} />
					</article>
				</div>
				<aside className="hidden lg:block">
					<TableOfContents source={article.content} />
				</aside>
			</div>
		</PageLayout>
	);
}
