import { IconFolder, IconPhotoOff, IconTrash } from "@tabler/icons-react";
import { Button } from "#/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#/components/ui/empty";
import type { MediaFile } from "#/features/media/media.types";
import { MediaCard } from "./media-card";
import { MediaDeleteDialog } from "./media-delete-dialog";
import { MediaMoveDialog } from "./media-move-dialog";

interface MediaGalleryProps {
	media: MediaFile[];
	selectedPaths: string[];
	onSelectionChange: (paths: string[]) => void;
	onDelete: (images: MediaFile[]) => Promise<void>;
	pending?: boolean;
}

export function MediaGallery({
	media,
	selectedPaths,
	onSelectionChange,
	onDelete,
	pending,
}: MediaGalleryProps) {
	const selectedSet = new Set(selectedPaths);
	const selected = media.filter((image) => selectedSet.has(image.path));
	if (!media.length)
		return (
			<Empty className="border border-dashed">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<IconPhotoOff />
					</EmptyMedia>
					<EmptyTitle>No matching assets</EmptyTitle>
					<EmptyDescription>
						Upload an image or adjust the search and filters.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
				<p aria-live="polite" className="text-sm text-muted-foreground">
					{selected.length
						? `${selected.length} selected`
						: `${media.length} assets`}
				</p>
				<div className="flex flex-wrap items-center gap-2">
					{selected.length ? (
						<>
							<MediaMoveDialog images={selected}>
								<Button
									variant="outline"
									size="sm"
									disabled={pending || selected.length > 100}
								>
									<IconFolder data-icon="inline-start" />
									Move
								</Button>
							</MediaMoveDialog>
							<MediaDeleteDialog images={selected} onConfirm={onDelete}>
								<Button
									variant="destructive"
									size="sm"
									disabled={pending || selected.length > 100}
								>
									<IconTrash data-icon="inline-start" />
									Delete
								</Button>
							</MediaDeleteDialog>
							<Button
								variant="ghost"
								size="sm"
								disabled={pending}
								onClick={() => onSelectionChange([])}
							>
								Clear
							</Button>
						</>
					) : (
						<Button
							variant="outline"
							size="sm"
							disabled={pending}
							onClick={() =>
								onSelectionChange(
									media.slice(0, 100).map((image) => image.path),
								)
							}
						>
							{media.length > 100 ? "Select first 100" : "Select all"}
						</Button>
					)}
				</div>
			</div>
			{selected.length > 100 ? (
				<p role="alert" className="text-sm text-destructive">
					Select up to 100 assets per operation.
				</p>
			) : null}
			<div className="grid grid-cols-[repeat(auto-fill,minmax(min(180px,100%),1fr))] gap-4">
				{media.map((image) => (
					<MediaCard
						key={image.path}
						media={image}
						selected={selectedSet.has(image.path)}
						onSelectedChange={(checked) =>
							onSelectionChange(
								checked
									? [...new Set([...selectedPaths, image.path])]
									: selectedPaths.filter((path) => path !== image.path),
							)
						}
						onDelete={(target) => onDelete([target])}
					/>
				))}
			</div>
		</div>
	);
}
