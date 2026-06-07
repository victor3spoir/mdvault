import { createFileRoute } from "@tanstack/react-router";
import { getArticleById } from "#/features/articles/articles.functions";
import { ArticleEditor } from "#/features/articles/components/article-editor";

export const Route = createFileRoute("/cms/articles/$id/edit")({
	loader: ({ params }) => getArticleById({ data: { id: params.id } }),
	component: EditArticlePage,
});

function EditArticlePage() {
	const article = Route.useLoaderData();

	if (!article) {
		return (
			<div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
				The requested article could not be loaded.
			</div>
		);
	}

	return <ArticleEditor article={article} mode="edit" />;
}
