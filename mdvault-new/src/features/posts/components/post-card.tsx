import {
	IconCheck,
	IconEdit,
	IconEye,
	IconFileText,
	IconTrash,
	IconX,
} from "@tabler/icons-react";
import { Link, useRouter } from "@tanstack/react-router";
import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { PrivateImage } from "#/features/media/components/private-image";
import {
	deletePostMutation,
	publishPostMutation,
	unpublishPostMutation,
} from "#/features/posts/posts.functions";
import type { Post } from "#/features/posts/posts.types";

export function PostCard({ post }: { post: Post }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const handleDelete = () => {
		if (!post.sha || !window.confirm(`Delete "${post.title}"?`)) {
			return;
		}

		startTransition(async () => {
			try {
				await deletePostMutation({ data: { id: post.id, sha: post.sha } });
				toast.success("Post deleted");
				router.invalidate();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to delete post",
				);
			}
		});
	};

	const handleTogglePublish = () => {
		startTransition(async () => {
			try {
				if (post.published) {
					await unpublishPostMutation({ data: { id: post.id } });
					toast.success("Post unpublished");
				} else {
					await publishPostMutation({ data: { id: post.id } });
					toast.success("Post published");
				}
				router.invalidate();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to update post",
				);
			}
		});
	};

	return (
		<TooltipProvider>
			<article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:border-primary/20 hover:shadow-lg">
				<div className="relative aspect-video overflow-hidden bg-muted">
					{post.coverImage ? (
						<PrivateImage
							src={post.coverImage}
							alt={post.title}
							className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>
					) : (
						<div className="flex h-full items-center justify-center bg-muted/50">
							<IconFileText className="size-10 text-muted-foreground/20" />
						</div>
					)}
					<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-70" />
					<div className="absolute left-3 top-3">
						<Badge
							variant={post.published ? "default" : "secondary"}
							className="h-6 gap-1 rounded-lg px-2 text-[10px] font-bold uppercase tracking-wider shadow-lg"
						>
							{post.published ? (
								<>
									<IconCheck className="size-3" />
									Published
								</>
							) : (
								"Draft"
							)}
						</Badge>
					</div>
				</div>

				<div className="flex flex-1 flex-col p-5">
					<h3 className="mb-2 line-clamp-2 text-lg font-bold tracking-tight transition-colors group-hover:text-primary">
						{post.title}
					</h3>
					<p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
						{post.content}
					</p>

					<div className="mb-4 flex flex-wrap items-center gap-3 text-[11px] font-medium text-muted-foreground">
						<span>{new Date(post.createdAt).toLocaleDateString()}</span>
						{post.author ? (
							<span className="border-l pl-3">By {post.author}</span>
						) : null}
					</div>

					{post.article ? (
						<div className="mb-4 flex items-center gap-2 rounded-lg bg-muted/30 p-2 text-[11px] text-muted-foreground">
							<IconFileText className="size-3 shrink-0" />
							<span className="truncate">Related article</span>
						</div>
					) : null}

					<div className="flex items-center justify-between gap-2 border-t pt-4">
						<Badge
							variant="outline"
							className="rounded-md text-[10px] font-medium"
						>
							{post.lang === "fr" ? "Français" : "English"}
						</Badge>

						<div className="flex items-center gap-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										asChild
										variant="ghost"
										size="icon"
										className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
									>
										<Link to="/cms/posts/$slug" params={{ slug: post.id }}>
											<IconEye className="size-4" />
										</Link>
									</Button>
								</TooltipTrigger>
								<TooltipContent>View post</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										asChild
										variant="ghost"
										size="icon"
										className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
									>
										<Link to="/cms/posts/$slug/edit" params={{ slug: post.id }}>
											<IconEdit className="size-4" />
										</Link>
									</Button>
								</TooltipTrigger>
								<TooltipContent>Edit post</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										disabled={isPending}
										onClick={handleTogglePublish}
										className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
									>
										{post.published ? (
											<IconX className="size-4 text-amber-600" />
										) : (
											<IconCheck className="size-4 text-emerald-600" />
										)}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{post.published ? "Unpublish" : "Publish"}
								</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										disabled={isPending}
										onClick={handleDelete}
										className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
									>
										<IconTrash className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Delete post</TooltipContent>
							</Tooltip>
						</div>
					</div>
				</div>
			</article>
		</TooltipProvider>
	);
}
