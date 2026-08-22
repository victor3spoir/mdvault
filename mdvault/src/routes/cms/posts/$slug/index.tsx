import { IconFileText } from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LocaleFlag } from "#/components/locale-flag";
import { PageLayout } from "#/components/page-layout";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { PrivateImage } from "#/features/media/components/private-image";
import { PostContent } from "#/features/posts/components/post-content";
import { postQueryOptions } from "#/features/posts/posts.queries";
import { getLocaleLabel } from "#/features/shared/locales";
import { formatDate } from "#/lib/date";

export const Route = createFileRoute("/cms/posts/$slug/")({
	loader: async ({ context, params }) => {
		const post = await context.queryClient.ensureQueryData(
			postQueryOptions(params.slug),
		);

		if (post) {
		}

		return post;
	},
	component: PostDetailPage,
});

function PostDetailPage() {
	const post = Route.useLoaderData();

	if (!post) {
		return (
			<PageLayout title="Post Not Found">
				<div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
					The requested post could not be loaded.
				</div>
			</PageLayout>
		);
	}

	return (
		<PageLayout
			title={post.title}
			description={post.content.substring(0, 100)}
			actions={
				<div className="flex items-center gap-2">
					<Button asChild variant="outline">
						<Link to="/cms/posts">Back</Link>
					</Button>
					<Button asChild>
						<Link to="/cms/posts/$slug/edit" params={{ slug: post.id }}>
							Edit Post
						</Link>
					</Button>
				</div>
			}
		>
			<div className="max-w-2xl">
				{post.coverImage ? (
					<div className="mb-6 overflow-hidden rounded-2xl border bg-muted">
						<PrivateImage
							src={post.coverImage}
							alt={post.title}
							className="aspect-video w-full object-cover"
						/>
					</div>
				) : null}

				<div className="space-y-4">
					<div className="flex items-start justify-between gap-4">
						<div>
							<div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
								<span>{formatDate(post.createdAt)}</span>
								{post.author ? <span>• By {post.author}</span> : null}
								<Badge variant="outline" className="text-[10px]">
									<LocaleFlag locale={post.lang} />
									{getLocaleLabel(post.lang)}
								</Badge>
							</div>
						</div>
						<Badge variant={post.published ? "default" : "secondary"}>
							{post.published ? "Published" : "Draft"}
						</Badge>
					</div>

					{post.article ? (
						<Button asChild variant="outline" size="sm">
							<Link to="/cms/articles/$id" params={{ id: post.article }}>
								<IconFileText data-icon="inline-start" />
								View related article
							</Link>
						</Button>
					) : null}

					<div className="mt-6">
						<PostContent content={post.content} />
					</div>
				</div>
			</div>
		</PageLayout>
	);
}
