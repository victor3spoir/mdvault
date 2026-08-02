import {
	IconCalendar,
	IconCheck,
	IconEdit,
	IconEye,
	IconFileText,
	IconLanguage,
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
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { PrivateImage } from "#/features/media/components/private-image";
import {
	deleteVaultAssetMutation,
	setVaultAssetPublishedMutation,
} from "#/features/vault/vault.functions";
import { invalidateVaultQueries } from "#/features/vault/vault.queries";
import type { VaultAsset } from "#/features/vault/vault.types";
import { useConfirm } from "#/hooks/use-confirm";
import { useValueChanged } from "#/hooks/use-value-changed";
import { formatDate } from "#/lib/date";
import { cn } from "#/lib/utils";

interface VaultAssetCardProps {
	asset: VaultAsset;
	type: string;
}

export function VaultAssetCard({ asset, type }: VaultAssetCardProps) {
	const queryClient = useQueryClient();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const statusChanged = useValueChanged(asset.published);
	const { confirm, confirmDialog } = useConfirm();

	const handleDelete = async () => {
		const confirmed = await confirm({
			title: `Delete "${asset.title}"?`,
			description:
				"This removes the file from your repository. The change is committed and can still be recovered from git history.",
		});

		if (!confirmed) {
			return;
		}
		startTransition(async () => {
			try {
				await deleteVaultAssetMutation({
					data: {
						type,
						id: asset.id,
						revision: { path: asset.path, sha: asset.sha },
					},
				});
				toast.success("Deleted");
				await invalidateVaultQueries(queryClient);
				router.invalidate();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to delete",
				);
			}
		});
	};

	const handleTogglePublish = () => {
		startTransition(async () => {
			try {
				await setVaultAssetPublishedMutation({
					data: {
						type,
						id: asset.id,
						published: !asset.published,
						revision: { path: asset.path, sha: asset.sha },
					},
				});
				toast.success(asset.published ? "Unpublished" : "Published");
				await invalidateVaultQueries(queryClient);
				router.invalidate();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to change status",
				);
			}
		});
	};

	return (
		<article
			className={cn(
				"group relative flex flex-col overflow-hidden rounded-2xl border transition-[border-color,box-shadow] duration-200 ease-out hover:border-primary/20 hover:shadow-lg",
				asset.published
					? "bg-card"
					: "border-dashed border-muted-foreground/30 bg-card/60",
			)}
		>
			<div className="relative aspect-video overflow-hidden bg-muted">
				{asset.coverImage ? (
					<PrivateImage
						src={asset.coverImage}
						alt={asset.title}
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
						variant={asset.published ? "default" : "secondary"}
						className={cn(
							"h-6 gap-1 rounded-lg px-2 text-[10px] font-bold uppercase tracking-wider shadow-lg",
							statusChanged &&
								"animate-in fade-in zoom-in-95 duration-200 ease-out",
						)}
					>
						{asset.published ? (
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
						{asset.lang === "fr" ? "FR" : "EN"}
					</Badge>
				</div>
			</div>

			<div className="flex flex-1 flex-col p-5">
				{asset.tags && asset.tags.length > 0 ? (
					<div className="mb-3 flex flex-wrap gap-2">
						{asset.tags.slice(0, 2).map((tag) => (
							<Badge
								key={tag}
								variant="outline"
								className="rounded-lg border-muted bg-muted/30 px-2 py-0 text-[10px] font-medium text-muted-foreground"
							>
								{tag}
							</Badge>
						))}
						{asset.tags.length > 2 ? (
							<Badge
								variant="outline"
								className="rounded-lg border-muted bg-muted/30 px-2 py-0 text-[10px] font-medium text-muted-foreground"
							>
								+{asset.tags.length - 2}
							</Badge>
						) : null}
					</div>
				) : null}

				<h3 className="mb-2 line-clamp-2 text-lg font-bold tracking-tight transition-colors group-hover:text-primary">
					{asset.title}
				</h3>
				<p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
					{asset.description || "No description provided."}
				</p>

				<div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-muted-foreground">
					<span className="flex items-center gap-1.5">
						<IconCalendar className="size-3.5" />
						{formatDate(asset.createdAt)}
					</span>
					{asset.author ? (
						<span className="truncate border-l pl-3">By {asset.author}</span>
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
									aria-label={`View ${asset.title}`}
									className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
								>
									<Link
										to="/cms/vault/$id"
										params={{ id: asset.id }}
										search={{ type }}
									>
										<IconEye className="size-4" />
									</Link>
								</Button>
							</TooltipTrigger>
							<TooltipContent>View</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									asChild
									variant="ghost"
									size="icon"
									aria-label={`Edit ${asset.title}`}
									className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
								>
									<Link
										to="/cms/vault/$id/edit"
										params={{ id: asset.id }}
										search={{ type }}
									>
										<IconEdit className="size-4" />
									</Link>
								</Button>
							</TooltipTrigger>
							<TooltipContent>Edit</TooltipContent>
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
									aria-label={`${asset.published ? "Unpublish" : "Publish"} ${asset.title}`}
									className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
								>
									{asset.published ? (
										<IconX className="size-4 text-amber-600" />
									) : (
										<IconCheck className="size-4 text-emerald-600" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{asset.published ? "Unpublish" : "Publish"}
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									disabled={isPending}
									onClick={handleDelete}
									aria-label={`Delete ${asset.title}`}
									className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
								>
									<IconTrash className="size-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Delete</TooltipContent>
						</Tooltip>
					</div>
				</div>
			</div>
			{confirmDialog}
		</article>
	);
}
