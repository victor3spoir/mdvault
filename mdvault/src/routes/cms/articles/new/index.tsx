import { createFileRoute } from "@tanstack/react-router";
import { ArticleEditor } from "#/features/articles/components/article-editor";
import { mediaListQueryOptions } from "#/features/media/media.queries";
import { vaultConfigQueryOptions } from "#/features/vault/vault.queries";

export const Route = createFileRoute("/cms/articles/new/")({
	loader: async ({ context }) => {
		const [, config] = await Promise.all([
			context.queryClient.ensureQueryData(mediaListQueryOptions()),
			context.queryClient.ensureQueryData(vaultConfigQueryOptions()),
		]);

		return config;
	},
	component: NewArticlePage,
});

function NewArticlePage() {
	const config = Route.useLoaderData();

	return (
		<ArticleEditor
			mode="create"
			locales={config.locales}
			defaultLocale={config.defaultLocale}
		/>
	);
}
