import { IconPhoto, IconUpload } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import { ImageSelector } from "#/features/media/components/image-selector";
import { ImageUploader } from "#/features/media/components/image-uploader";
import type { MediaFile } from "#/features/media/media.types";

interface ImageInsertDialogProps {
	open: boolean;
	onClose: () => void;
	onSelect: (image: MediaFile) => void;
}

export function ImageInsertDialog({
	open,
	onClose,
	onSelect,
}: ImageInsertDialogProps) {
	const [selectedImage, setSelectedImage] = useState<MediaFile | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);

	return (
		<Sheet
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					setSelectedImage(null);
					onClose();
				}
			}}
		>
			<SheetContent
				side="right"
				className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
			>
				<SheetHeader className="border-b p-6">
					<SheetTitle className="text-2xl font-bold tracking-tight">
						Insert Image
					</SheetTitle>
					<SheetDescription className="text-base">
						Upload a new image or select from your library
					</SheetDescription>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto p-6">
					<div className="space-y-8">
						<div className="space-y-4">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<IconUpload className="size-5" />
								</div>
								<div>
									<h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
										Upload New
									</h3>
									<p className="text-xs text-muted-foreground">
										Drag & drop or click to select
									</p>
								</div>
							</div>
							<div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 p-2 transition-colors hover:bg-muted/10">
								<ImageUploader
									onUploadSuccess={(image) => {
										setRefreshKey((value) => value + 1);
										setSelectedImage(image);
									}}
								/>
							</div>
						</div>

						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<Separator className="w-full" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-2 text-muted-foreground">
									Or select from library
								</span>
							</div>
						</div>

						<div className="space-y-4">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-foreground/70">
									<IconPhoto className="size-5" />
								</div>
								<div>
									<h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
										Your Library
									</h3>
									<p className="text-xs text-muted-foreground">
										Choose an image to insert
									</p>
								</div>
							</div>
							<ImageSelector
								key={refreshKey}
								selectedImageUrl={selectedImage?.url ?? ""}
								onSelectImage={setSelectedImage}
							/>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-end gap-3 border-t bg-muted/30 p-6">
					<Button type="button" variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={() => {
							if (selectedImage) {
								onSelect(selectedImage);
								setSelectedImage(null);
								onClose();
							}
						}}
						disabled={!selectedImage}
					>
						Insert Image
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	);
}
