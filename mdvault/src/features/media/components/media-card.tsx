import {
	IconDownload,
	IconEye,
	IconLink,
	IconMarkdown,
	IconTrash,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { MediaDeleteDialog } from "#/features/media/components/media-delete-dialog";
import { MediaPreviewDialog } from "#/features/media/components/media-preview-dialog";
import { PrivateImage } from "#/features/media/components/private-image";
import { downloadMedia } from "#/features/media/media.download";
import type { MediaFile } from "#/features/media/media.types";
import { cn } from "#/lib/utils";

interface MediaCardProps {
	media: MediaFile;
	selected: boolean;
	onSelectedChange: (checked: boolean) => void;
	onDelete: (image: MediaFile) => Promise<void> | void;
}

const actionButtonClass =
	"size-9 rounded-lg border bg-background/90 text-foreground shadow-sm backdrop-blur transition-[color,background-color,scale] hover:bg-background active:scale-[0.97]";

export function MediaCard({
	media,
	selected,
	onSelectedChange,
	onDelete,
}: MediaCardProps) {
	const queryClient = useQueryClient();
	const [isDownloading, setIsDownloading] = useState(false);

	const handleDownload = async () => {
		setIsDownloading(true);
		try {
			await downloadMedia(queryClient, media.url, media.name);
			toast.success(`Downloading ${media.name}`);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to download",
			);
		} finally {
			setIsDownloading(false);
		}
	};

	const copy = async (value: string, message: string) => {
		try {
			await navigator.clipboard.writeText(value);
			toast.success(message);
		} catch {
			toast.error("Could not copy to clipboard");
		}
	};

	return (
		<div
			className={cn(
				"group relative aspect-square overflow-hidden rounded-xl border bg-muted/20 transition-shadow duration-200 ease-out hover:shadow-md",
				selected
					? "border-primary ring-2 ring-primary/20"
					: "hover:border-primary/40",
			)}
		>
			<PrivateImage
				src={media.url}
				width={400}
				alt={media.name}
				className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
			/>

			<div
				className={cn(
					"absolute top-2.5 left-2.5 z-10 rounded-md bg-background/80 p-0.5 shadow-sm backdrop-blur transition-opacity",
					selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
				)}
			>
				<Checkbox
					checked={selected}
					onCheckedChange={onSelectedChange}
					aria-label={`Select ${media.name}`}
				/>
			</div>

			<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/30 to-black/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

			{/*
			 * Five actions do not fit on one row of a square thumbnail. The row is
			 * capped so it wraps predictably into 3 + 2 and stays centred, instead
			 * of squeezing against the card edges.
			 */}
			<div className="absolute inset-0 flex items-center justify-center p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
				<div className="flex max-w-[8.75rem] flex-wrap items-center justify-center gap-2">
					<Tooltip>
						<TooltipTrigger asChild>
							<MediaPreviewDialog image={media}>
								<Button
									type="button"
									size="icon"
									variant="ghost"
									aria-label="Preview asset"
									className={actionButtonClass}
								>
									<IconEye className="size-4" />
								</Button>
							</MediaPreviewDialog>
						</TooltipTrigger>
						<TooltipContent side="top" sideOffset={6}>
							Preview
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								size="icon"
								variant="ghost"
								aria-label="Copy asset URL"
								className={actionButtonClass}
								onClick={() => copy(media.url, "URL copied")}
							>
								<IconLink className="size-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="top" sideOffset={6}>
							Copy URL
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								size="icon"
								variant="ghost"
								aria-label="Copy markdown"
								className={actionButtonClass}
								onClick={() =>
									copy(`![${media.name}](${media.url})`, "Markdown copied")
								}
							>
								<IconMarkdown className="size-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="top" sideOffset={6}>
							Copy Markdown
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								size="icon"
								variant="ghost"
								aria-label={`Download ${media.name}`}
								className={actionButtonClass}
								disabled={isDownloading}
								onClick={handleDownload}
							>
								<IconDownload className="size-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="top" sideOffset={6}>
							Download
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<MediaDeleteDialog
								image={media}
								onConfirm={([target]) => onDelete(target)}
							>
								<Button
									type="button"
									size="icon"
									variant="ghost"
									aria-label="Delete asset"
									className={cn(
										actionButtonClass,
										"text-muted-foreground hover:bg-destructive hover:text-destructive-foreground",
									)}
								>
									<IconTrash className="size-4" />
								</Button>
							</MediaDeleteDialog>
						</TooltipTrigger>
						<TooltipContent side="top" sideOffset={6}>
							Delete
						</TooltipContent>
					</Tooltip>
				</div>
			</div>

			<div className="absolute inset-x-0 bottom-0 p-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
				<p
					className="truncate text-xs font-medium text-white"
					title={media.name}
				>
					{media.name}
				</p>
			</div>
		</div>
	);
}
