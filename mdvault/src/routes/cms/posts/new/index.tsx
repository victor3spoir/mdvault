import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "#/components/page-layout";
import { articlesListQueryOptions } from "#/features/articles/articles.queries";
import { PostForm } from "#/features/posts/components/post-form";

export const Route = createFileRoute("/cms/posts/new/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(articlesListQueryOptions()),
	component: NewPostPage,
});

function NewPostPage() {
	const articles = Route.useLoaderData();

	return (
		<PageLayout
			title="New Post"
			description="Create a new short-form markdown post."
		>
			<PostForm articles={articles} />
		</PageLayout>
	);
}
