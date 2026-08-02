import {
	IconCalendar,
	IconCheck,
	IconEdit,
	IconEye,
	IconFileText,
	IconHourglass,
	IconLanguage,
	IconSettings,
	IconTrash,
	IconX,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
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
import {
	deleteArticleMutation,
	publishArticleMutation,
	unpublishArticleMutation,
} from "#/features/articles/articles.functions";
import { invalidateArticleQueries } from "#/features/articles/articles.queries";
import type { Article } from "#/features/articles/articles.types";
import { getContentStats } from "#/features/articles/articles.utils";
import { PrivateImage } from "#/features/media/components/private-image";
import { useValueChanged } from "#/hooks/use-value-changed";
import { formatDate } from "#/lib/date";
import { cn } from "#/lib/utils";

export function ArticleCard({ article }: { article: Article }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [isPending, startTransition] = useTransition();
	const statusChanged = useValueChanged(article.published);
	const stats = getContentStats(article.content);

	const handleDelete = () => {
		if (!window.confirm(`Delete "${article.title}"?`)) {
			return;
		}

		startTransition(async () => {
			try {
				await deleteArticleMutation({
					data: {
						id: article.id,
						revision: { path: article.path, sha: article.sha },
					},
				});
				toast.success("Article deleted");
				await invalidateArticleQueries(queryClient);
				router.invalidate();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to delete article",
				);
			}
		});
	};

	const handleTogglePublish = () => {
		startTransition(async () => {
			try {
				const revision = { path: article.path, sha: article.sha };
				if (article.published) {
					await unpublishArticleMutation({
						data: { id: article.id, revision },
					});
					toast.success("Article unpublished");
				} else {
					await publishArticleMutation({
						data: { id: article.id, revision },
					});
					toast.success("Article published");
				}
				await invalidateArticleQueries(queryClient);
				router.invalidate();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to update article",
				);
			}
		});
	};

	return (
		<TooltipProvider>
			<article
				className={cn(
					"group relative flex flex-col overflow-hidden rounded-2xl border transition-[border-color,box-shadow] duration-200 ease-out hover:border-primary/20 hover:shadow-lg",
					article.published
						? "bg-card"
						: "border-dashed border-muted-foreground/30 bg-card/60",
				)}
			>
				<div className="relative aspect-video overflow-hidden bg-muted">
					{article.coverImage ? (
						<PrivateImage
							src={article.coverImage}
							alt={article.title}
							className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>
					) : (
						<div className="flex h-full items-center justify-center bg-muted/50">
							<IconFileText className="size-10 text-muted-foreground/20" />
						</div>
					)}
					<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-70" />
					<div className="absolute inset-x-3 top-3 flex gap-2">
						<Badge
							variant={article.published ? "default" : "secondary"}
							className={cn(
								"h-6 gap-1 rounded-lg px-2 text-[10px] font-bold uppercase tracking-wider shadow-lg",
								statusChanged &&
									"animate-in fade-in zoom-in-95 duration-200 ease-out",
							)}
						>
							{article.published ? (
								<>
									<IconCheck className="size-3" />
									Published
								</>
							) : (
								"Draft"
							)}
						</Badge>
						<Badge
							variant="outline"
							className="h-6 gap-1 rounded-lg border-primary/30 bg-background/90 px-2 text-[10px] font-semibold uppercase tracking-wide shadow-lg"
						>
							<IconLanguage className="size-3" />
							{article.lang === "fr" ? "FR" : "EN"}
						</Badge>
					</div>
				</div>

				<div className="flex flex-1 flex-col p-5">
					<div className="mb-3 flex flex-wrap gap-2">
						{article.tags?.slice(0, 2).map((tag) => (
							<Badge
								key={tag}
								variant="outline"
								className="rounded-lg border-muted bg-muted/30 px-2 py-0 text-[10px] font-medium text-muted-foreground"
							>
								{tag}
							</Badge>
						))}
						{article.tags && article.tags.length > 2 ? (
							<Badge
								variant="outline"
								className="rounded-lg border-muted bg-muted/30 px-2 py-0 text-[10px] font-medium text-muted-foreground"
							>
								+{article.tags.length - 2}
							</Badge>
						) : null}
					</div>

					<h3 className="mb-2 line-clamp-2 text-lg font-bold tracking-tight transition-colors group-hover:text-primary">
						{article.title}
					</h3>
					<p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
						{article.description || "No description provided for this article."}
					</p>

					<div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-muted-foreground">
						<span className="flex items-center gap-1.5">
							<IconCalendar className="size-3.5" />
							{formatDate(article.createdAt)}
						</span>
						<span className="flex items-center gap-1.5 border-l pl-3">
							<IconHourglass className="size-3.5" />
							{stats.readTime} min read
						</span>
						{article.author ? (
							<span className="truncate border-l pl-3">
								By {article.author}
							</span>
						) : null}
					</div>

					<div className="mt-4 flex items-center justify-between gap-2 border-t pt-4">
						<div className="flex items-center gap-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										asChild
										variant="ghost"
										size="icon"
										aria-label={`View ${article.title}`}
										className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
									>
										<Link to="/cms/articles/$id" params={{ id: article.id }}>
											<IconEye className="size-4" />
										</Link>
									</Button>
								</TooltipTrigger>
								<TooltipContent>View article</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										asChild
										variant="ghost"
										size="icon"
										aria-label={`Edit ${article.title}`}
										className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
									>
										<Link
											to="/cms/articles/$id/edit"
											params={{ id: article.id }}
										>
											<IconEdit className="size-4" />
										</Link>
									</Button>
								</TooltipTrigger>
								<TooltipContent>Edit article</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										asChild
										variant="ghost"
										size="icon"
										aria-label={`Edit settings for ${article.title}`}
										className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
									>
										<Link
											to="/cms/articles/$id/edit"
											params={{ id: article.id }}
										>
											<IconSettings className="size-4" />
										</Link>
									</Button>
								</TooltipTrigger>
								<TooltipContent>Settings</TooltipContent>
							</Tooltip>
						</div>

						<div className="flex items-center gap-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										disabled={isPending}
										onClick={handleTogglePublish}
										aria-label={`${article.published ? "Unpublish" : "Publish"} ${article.title}`}
										className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
									>
										{article.published ? (
											<IconX className="size-4 text-amber-600" />
										) : (
											<IconCheck className="size-4 text-emerald-600" />
										)}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{article.published ? "Unpublish" : "Publish"}
								</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										disabled={isPending}
										onClick={handleDelete}
										aria-label={`Delete ${article.title}`}
										className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
									>
										<IconTrash className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Delete article</TooltipContent>
							</Tooltip>
						</div>
					</div>
				</div>
			</article>
		</TooltipProvider>
	);
}
