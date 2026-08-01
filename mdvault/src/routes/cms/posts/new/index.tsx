import { createFileRoute } from "@tanstack/react-router";
import { articlesListQueryOptions } from "#/features/articles/articles.queries";
import { PostEditor } from "#/features/posts/components/post-editor";

export const Route = createFileRoute("/cms/posts/new/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(articlesListQueryOptions()),
	component: NewPostPage,
});

function NewPostPage() {
	const articles = Route.useLoaderData();

	return <PostEditor articles={articles} />;
}
