import { IconPhotoPlus, IconReplace, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { ImageInsertDialog } from "#/features/media/components/image-insert-dialog";
import { PrivateImage } from "#/features/media/components/private-image";
import type { MediaFile } from "#/features/media/media.types";

interface CoverImageSelectorProps {
	selectedImageUrl: string;
	onSelectImage: (image: MediaFile) => void;
}

const EMPTY_IMAGE: MediaFile = {
	id: "",
	name: "",
	path: "",
	url: "",
	uploadedAt: "",
	size: 0,
	sha: "",
};

export function CoverImageSelector({
	selectedImageUrl,
	onSelectImage,
}: CoverImageSelectorProps) {
	const [open, setOpen] = useState(false);

	return (
		<div>
			{selectedImageUrl ? (
				<div className="group/cover relative overflow-hidden rounded-xl border bg-muted shadow-xs">
					<PrivateImage
						src={selectedImageUrl}
						width={400}
						alt="Cover image"
						className="aspect-video w-full object-cover transition-transform duration-300 group-hover/cover:scale-[1.03]"
					/>
					<div className="absolute inset-0 flex items-end justify-end gap-1.5 bg-gradient-to-t from-black/60 via-black/10 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover/cover:opacity-100 focus-within:opacity-100">
						<Button
							type="button"
							size="sm"
							variant="secondary"
							className="h-7 gap-1 bg-white/90 px-2 text-xs text-slate-900 hover:bg-white"
							onClick={() => setOpen(true)}
						>
							<IconReplace className="size-3.5" />
							Replace
						</Button>
						<Button
							type="button"
							size="sm"
							variant="secondary"
							aria-label="Remove cover image"
							className="h-7 bg-white/90 px-2 text-slate-900 hover:bg-white hover:text-destructive"
							onClick={() => onSelectImage(EMPTY_IMAGE)}
						>
							<IconX className="size-3.5" />
						</Button>
					</div>
				</div>
			) : (
				<button
					type="button"
					onClick={() => setOpen(true)}
					className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
				>
					<IconPhotoPlus className="size-6 opacity-60" />
					<span>Select a cover image</span>
					<span className="text-[11px] text-muted-foreground/60">
						Recommended 16:9
					</span>
				</button>
			)}

			<ImageInsertDialog
				open={open}
				onClose={() => setOpen(false)}
				onSelect={(image) => {
					onSelectImage(image);
					setOpen(false);
				}}
			/>
		</div>
	);
}
