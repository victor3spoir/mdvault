import { IconPhotoOff, IconTrash } from "@tabler/icons-react";
import { useMemo } from "react";
import { Button } from "#/components/ui/button";
import { MediaCard } from "#/features/media/components/media-card";
import { MediaDeleteDialog } from "#/features/media/components/media-delete-dialog";
import type { MediaFile } from "#/features/media/media.types";

interface MediaGalleryProps {
	media: MediaFile[];
	search?: string;
	filter?: string;
	selectedPaths: string[];
	onToggleSelect: (path: string, checked: boolean) => void;
	onClearSelection: () => void;
	onDelete: (image: MediaFile) => Promise<void>;
	onDeleteMany: (images: MediaFile[]) => Promise<void>;
}

export function MediaGallery({
	media,
	search = "",
	filter = "all",
	selectedPaths,
	onToggleSelect,
	onClearSelection,
	onDelete,
	onDeleteMany,
}: MediaGalleryProps) {
	const filteredMedia = useMemo(() => {
		return media.filter((item) => {
			const matchesSearch =
				!search || item.name.toLowerCase().includes(search.toLowerCase());

			if (filter === "all") {
				return matchesSearch;
			}

			const ext = item.name.split(".").pop()?.toLowerCase() || "unknown";
			const normalizedExt = ext === "jpeg" ? "jpg" : ext;
			return matchesSearch && normalizedExt === filter;
		});
	}, [media, search, filter]);

	const selectedMedia = filteredMedia.filter((item) =>
		selectedPaths.includes(item.path),
	);

	if (filteredMedia.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-24 text-center">
				<div className="mb-3 rounded-lg bg-muted/20 p-3">
					<IconPhotoOff className="size-8 text-muted-foreground/60" />
				</div>
				<div className="max-w-sm space-y-1">
					<p className="text-sm font-semibold text-foreground">
						{media.length === 0 ? "No media found" : "No results"}
					</p>
					<p className="text-xs text-muted-foreground">
						{media.length === 0
							? "Upload your first asset to get started"
							: "Try adjusting your search or filters"}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{selectedMedia.length > 0 ? (
				<div className="flex items-center justify-between rounded-xl border bg-card/50 px-4 py-3">
					<p className="text-sm text-muted-foreground">
						{selectedMedia.length} asset
						{selectedMedia.length > 1 ? "s" : ""} selected
					</p>
					<div className="flex gap-2">
						<MediaDeleteDialog images={selectedMedia} onConfirm={onDeleteMany}>
							<Button variant="destructive" size="sm" className="gap-2">
								<IconTrash className="size-4" />
								Delete Selected
							</Button>
						</MediaDeleteDialog>
						<Button variant="ghost" size="sm" onClick={onClearSelection}>
							Clear
						</Button>
					</div>
				</div>
			) : null}

			<div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
				{filteredMedia.map((item) => (
					<MediaCard
						key={item.path}
						media={item}
						selected={selectedPaths.includes(item.path)}
						onSelectedChange={(checked) =>
							onToggleSelect(item.path, checked === true)
						}
						onDelete={onDelete}
					/>
				))}
			</div>
		</div>
	);
}
