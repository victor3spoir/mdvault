import { createFileRoute } from "@tanstack/react-router";
import { articlesListQueryOptions } from "#/features/articles/articles.queries";
import { PostEditor } from "#/features/posts/components/post-editor";
import { postQueryOptions } from "#/features/posts/posts.queries";

export const Route = createFileRoute("/cms/posts/$slug/edit/")({
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

	if (!post) {
		return (
			<div className="p-8">
				<div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
					The requested post could not be loaded.
				</div>
			</div>
		);
	}

	return <PostEditor post={post} articles={articles} />;
}
