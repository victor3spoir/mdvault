import { useState } from "react";
import { Button } from "#/components/ui/button";
import { ImageInsertDialog } from "#/features/media/components/image-insert-dialog";
import { PrivateImage } from "#/features/media/components/private-image";
import type { MediaFile } from "#/features/media/media.types";

interface CoverImageSelectorProps {
	selectedImageUrl: string;
	onSelectImage: (image: MediaFile) => void;
}

export function CoverImageSelector({
	selectedImageUrl,
	onSelectImage,
}: CoverImageSelectorProps) {
	const [open, setOpen] = useState(false);

	return (
		<div className="space-y-3">
			{selectedImageUrl ? (
				<div className="overflow-hidden rounded-xl border bg-muted">
					<PrivateImage
						src={selectedImageUrl}
						alt="Cover image"
						className="aspect-square w-full object-cover"
					/>
				</div>
			) : (
				<div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
					No cover image selected
				</div>
			)}

			<div className="flex gap-2">
				<Button type="button" variant="outline" onClick={() => setOpen(true)}>
					Select Image
				</Button>
				{selectedImageUrl ? (
					<Button
						type="button"
						variant="ghost"
						onClick={() =>
							onSelectImage({
								id: "",
								name: "",
								path: "",
								url: "",
								uploadedAt: "",
								sha: "",
							})
						}
					>
						Remove
					</Button>
				) : null}
			</div>

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
