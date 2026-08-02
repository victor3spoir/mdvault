import { IconPhotoPlus } from "@tabler/icons-react";
import { Button } from "#/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "#/components/ui/sheet";
import { ImageUploader } from "#/features/media/components/image-uploader";
import type { MediaFile } from "#/features/media/media.types";

interface MediaUploadSheetProps {
	onUploadSuccess: (image: MediaFile) => void;
}

export function MediaUploadSheet({ onUploadSuccess }: MediaUploadSheetProps) {
	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button
					type="button"
					size="sm"
					className="h-8 gap-2 rounded-lg px-3 shadow-sm hover:shadow-md"
				>
					<IconPhotoPlus className="size-4" />
					Upload Asset
				</Button>
			</SheetTrigger>
			<SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
				<SheetHeader className="shrink-0">
					<SheetTitle className="text-xl font-bold">Upload Asset</SheetTitle>
					<SheetDescription>
						Add new images to your media library. They are optimized before
						being committed to the repository.
					</SheetDescription>
				</SheetHeader>
				<div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
					<ImageUploader onUploadSuccess={onUploadSuccess} />
				</div>
			</SheetContent>
		</Sheet>
	);
}
