import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "#/components/page-layout";
import { getArticles } from "#/features/articles/articles.functions";
import { PostForm } from "#/features/posts/components/post-form";
import { getPostBySlug } from "#/features/posts/posts.functions";

export const Route = createFileRoute("/cms/posts/$slug/edit")({
	loader: async ({ params }) => ({
		post: await getPostBySlug({ data: { slug: params.slug } }),
		articles: await getArticles(),
	}),
	component: EditPostPage,
});

function EditPostPage() {
	const { post, articles } = Route.useLoaderData();

	return (
		<PageLayout
			title={post ? `Edit: ${post.title}` : "Post Not Found"}
			description="Edit the markdown source and post metadata."
		>
			{post ? (
				<PostForm post={post} articles={articles} />
			) : (
				<div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
					The requested post could not be loaded.
				</div>
			)}
		</PageLayout>
	);
}
