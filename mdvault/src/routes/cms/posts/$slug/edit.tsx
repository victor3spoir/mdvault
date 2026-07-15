import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "#/components/page-layout";
import { articlesListQueryOptions } from "#/features/articles/articles.queries";
import { PostForm } from "#/features/posts/components/post-form";
import { postQueryOptions } from "#/features/posts/posts.queries";

export const Route = createFileRoute("/cms/posts/$slug/edit")({
	loader: async ({ context, params }) => {
		const [post, articles] = await Promise.all([
			context.queryClient.ensureQueryData(postQueryOptions(params.slug)),
			context.queryClient.ensureQueryData(articlesListQueryOptions()),
		]);

		return { post, articles };
	},
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
