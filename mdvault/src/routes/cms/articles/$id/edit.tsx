import { createFileRoute } from "@tanstack/react-router";
import { articleQueryOptions } from "#/features/articles/articles.queries";
import { ArticleEditor } from "#/features/articles/components/article-editor";
import { vaultConfigQueryOptions } from "#/features/vault/vault.queries";

export const Route = createFileRoute("/cms/articles/$id/edit")({
	loader: async ({ context, params }) => {
		const [article, config] = await Promise.all([
			context.queryClient.ensureQueryData(articleQueryOptions(params.id)),
			context.queryClient.ensureQueryData(vaultConfigQueryOptions()),
		]);
		return { article, config };
	},
	component: EditArticlePage,
});

function EditArticlePage() {
	const { article, config } = Route.useLoaderData();

	if (!article) {
		return (
			<div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
				The requested article could not be loaded.
			</div>
		);
	}

	return (
		<ArticleEditor
			article={article}
			mode="edit"
			locales={config.locales}
			defaultLocale={config.defaultLocale}
		/>
	);
}
