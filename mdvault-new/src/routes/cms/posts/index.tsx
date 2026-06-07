import { IconPlus } from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageLayout } from "#/components/page-layout";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { PostCard } from "#/features/posts/components/post-card";
import { getPosts } from "#/features/posts/posts.functions";

export const Route = createFileRoute("/cms/posts/")({
	loader: () => getPosts(),
	component: PostsPage,
});

function PostsPage() {
	const posts = Route.useLoaderData();

	return (
		<PageLayout
			title="Posts"
			description="Manage your LinkedIn-style posts."
			actions={
				<div className="flex items-center gap-2">
					<Badge
						variant="secondary"
						className="hidden h-6 rounded-lg px-2 text-xs font-bold sm:flex"
					>
						{posts.length} Posts
					</Badge>
					<Button asChild className="gap-2 rounded-xl">
						<Link to="/cms/posts/new">
							<IconPlus className="size-4" />
							New Post
						</Link>
					</Button>
				</div>
			}
		>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-6">
				{posts.map((post) => (
					<PostCard key={post.id} post={post} />
				))}
			</div>
		</PageLayout>
	);
}
