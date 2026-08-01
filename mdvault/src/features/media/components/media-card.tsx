import {
	IconEye,
	IconLink,
	IconMarkdown,
	IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { MediaDeleteDialog } from "#/features/media/components/media-delete-dialog";
import { MediaPreviewDialog } from "#/features/media/components/media-preview-dialog";
import { PrivateImage } from "#/features/media/components/private-image";
import type { MediaFile } from "#/features/media/media.types";

interface MediaCardProps {
	media: MediaFile;
	selected: boolean;
	onSelectedChange: (checked: boolean) => void;
	onDelete: (image: MediaFile) => Promise<void> | void;
}

export function MediaCard({
	media,
	selected,
	onSelectedChange,
	onDelete,
}: MediaCardProps) {
	const copy = async (value: string, message: string) => {
		try {
			await navigator.clipboard.writeText(value);
			toast.success(message);
		} catch {
			toast.error("Could not copy to clipboard");
		}
	};

	return (
		<TooltipProvider>
			<div className="group relative aspect-square overflow-hidden rounded-lg border bg-muted/20 transition-all hover:border-primary/50 hover:shadow-lg">
				<PrivateImage
					src={media.url}
					alt={media.name}
					className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
				/>

				<div className="absolute top-3 left-3 z-10">
					<Checkbox checked={selected} onCheckedChange={onSelectedChange} />
				</div>

				<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
					<div className="flex gap-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<MediaPreviewDialog image={media}>
									<Button type="button" size="icon" className="rounded-lg">
										<IconEye className="size-4" />
									</Button>
								</MediaPreviewDialog>
							</TooltipTrigger>
							<TooltipContent>Preview</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									size="icon"
									className="rounded-lg"
									onClick={() => copy(media.url, "URL copied")}
								>
									<IconLink className="size-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Copy URL</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									size="icon"
									className="rounded-lg"
									onClick={() =>
										copy(`![${media.name}](${media.url})`, "Markdown copied")
									}
								>
									<IconMarkdown className="size-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Copy Markdown</TooltipContent>
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
										className="rounded-lg bg-destructive/80 text-white hover:bg-destructive"
									>
										<IconTrash className="size-4" />
									</Button>
								</MediaDeleteDialog>
							</TooltipTrigger>
							<TooltipContent>Delete</TooltipContent>
						</Tooltip>
					</div>
				</div>

				<div className="absolute inset-x-0 bottom-0 translate-y-full bg-linear-to-t from-black/80 to-transparent p-2 transition-transform group-hover:translate-y-0">
					<p className="truncate text-xs font-medium text-white">
						{media.name}
					</p>
				</div>
			</div>
		</TooltipProvider>
	);
}
