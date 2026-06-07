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
					className="h-10 gap-2 rounded-lg px-4 font-semibold"
				>
					<IconPhotoPlus className="size-4" />
					Upload Asset
				</Button>
			</SheetTrigger>
			<SheetContent side="right" className="w-full sm:max-w-xl">
				<SheetHeader className="pb-8">
					<SheetTitle className="text-xl font-bold">Upload Asset</SheetTitle>
					<SheetDescription>
						Add new images to your media library
					</SheetDescription>
				</SheetHeader>
				<div className="rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/5 p-2">
					<ImageUploader onUploadSuccess={onUploadSuccess} />
				</div>
			</SheetContent>
		</Sheet>
	);
}
