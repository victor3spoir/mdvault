import { createFileRoute } from "@tanstack/react-router";
import { ArticleEditor } from "#/features/articles/components/article-editor";
import { mediaListQueryOptions } from "#/features/media/media.queries";

export const Route = createFileRoute("/cms/articles/new/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(mediaListQueryOptions()),
	component: NewArticlePage,
});

function NewArticlePage() {
	return <ArticleEditor mode="create" />;
}
