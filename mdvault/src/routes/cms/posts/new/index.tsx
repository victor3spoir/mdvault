import { createFileRoute } from "@tanstack/react-router";
import { articlesListQueryOptions } from "#/features/articles/articles.queries";
import { PostEditor } from "#/features/posts/components/post-editor";
import { vaultConfigQueryOptions } from "#/features/vault/vault.queries";

export const Route = createFileRoute("/cms/posts/new/")({
	loader: async ({ context }) => {
		const [articles, config] = await Promise.all([
			context.queryClient.ensureQueryData(articlesListQueryOptions()),
			context.queryClient.ensureQueryData(vaultConfigQueryOptions()),
		]);
		return { articles, config };
	},
	component: NewPostPage,
});

function NewPostPage() {
	const { articles, config } = Route.useLoaderData();

	return (
		<PostEditor
			articles={articles}
			locales={config.locales}
			defaultLocale={config.defaultLocale}
		/>
	);
}
