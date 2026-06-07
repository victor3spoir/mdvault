import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "#/components/page-layout";
import { getArticles } from "#/features/articles/articles.functions";
import { PostForm } from "#/features/posts/components/post-form";

export const Route = createFileRoute("/cms/posts/new")({
	loader: () => getArticles(),
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
