import {
	IconAccessible,
	IconCheck,
	IconPhoto,
	IconTextCaption,
	IconUpload,
} from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import { ImageSelector } from "#/features/media/components/image-selector";
import { ImageUploader } from "#/features/media/components/image-uploader";
import { PrivateImage } from "#/features/media/components/private-image";
import type { MediaFile } from "#/features/media/media.types";
import { cn } from "#/lib/utils";

interface ImageInsertDetails {
	alt: string;
	caption: string;
}

interface ImageInsertDialogProps {
	open: boolean;
	onClose: () => void;
	onSelect: (image: MediaFile, details: ImageInsertDetails) => void;
	/** Show alt text and caption fields before inserting (for in-content images). */
	withDetails?: boolean;
}

type InsertTab = "library" | "upload";

const TABS: Array<{ id: InsertTab; label: string; icon: typeof IconPhoto }> = [
	{ id: "library", label: "Library", icon: IconPhoto },
	{ id: "upload", label: "Upload", icon: IconUpload },
];

export function ImageInsertDialog({
	open,
	onClose,
	onSelect,
	withDetails = false,
}: ImageInsertDialogProps) {
	const [selectedImage, setSelectedImage] = useState<MediaFile | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const [tab, setTab] = useState<InsertTab>("library");
	const [alt, setAlt] = useState("");
	const [caption, setCaption] = useState("");

	function handleClose() {
		setSelectedImage(null);
		setTab("library");
		setAlt("");
		setCaption("");
		onClose();
	}

	return (
		<Sheet
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					handleClose();
				}
			}}
		>
			<SheetContent
				side="right"
				className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
			>
				<SheetHeader className="shrink-0 space-y-3 border-b px-6 pt-6 pb-4">
					<div>
						<SheetTitle className="text-xl font-bold tracking-tight">
							Insert Image
						</SheetTitle>
						<SheetDescription>
							Pick from your library or upload something new
						</SheetDescription>
					</div>

					<div
						role="tablist"
						aria-label="Image source"
						className="grid w-full grid-cols-2 gap-1 rounded-xl border bg-muted/40 p-1"
					>
						{TABS.map(({ id, label, icon: Icon }) => (
							<button
								key={id}
								role="tab"
								type="button"
								aria-selected={tab === id}
								onClick={() => setTab(id)}
								className={cn(
									"flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
									tab === id
										? "bg-background text-foreground shadow-xs"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								<Icon className="size-4" />
								{label}
							</button>
						))}
					</div>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto px-6 py-5">
					{tab === "upload" ? (
						<div className="space-y-4">
							<div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 p-2 transition-colors hover:border-primary/30 hover:bg-primary/5">
								<ImageUploader
									onUploadSuccess={(image) => {
										setRefreshKey((value) => value + 1);
										setSelectedImage(image);
										setTab("library");
									}}
								/>
							</div>
							<p className="text-center text-xs text-muted-foreground/70">
								Uploaded images are added to your library and selected
								automatically.
							</p>
						</div>
					) : (
						<ImageSelector
							key={refreshKey}
							selectedImageUrl={selectedImage?.url ?? ""}
							onSelectImage={setSelectedImage}
						/>
					)}
				</div>

				{withDetails && selectedImage ? (
					<div className="shrink-0 space-y-3 border-t bg-muted/10 px-6 py-4">
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="space-y-1.5">
								<Label
									htmlFor="image-alt-text"
									className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
								>
									<IconAccessible className="size-3.5" />
									Alt text
								</Label>
								<Input
									id="image-alt-text"
									value={alt}
									onChange={(event) => setAlt(event.target.value)}
									placeholder="Describe the image..."
									className="h-9 bg-background text-sm"
								/>
								<p className="text-[11px] text-muted-foreground/70">
									For screen readers and SEO.
								</p>
							</div>
							<div className="space-y-1.5">
								<Label
									htmlFor="image-caption"
									className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
								>
									<IconTextCaption className="size-3.5" />
									Caption
									<span className="font-normal normal-case text-muted-foreground/60">
										(optional)
									</span>
								</Label>
								<Input
									id="image-caption"
									value={caption}
									onChange={(event) => setCaption(event.target.value)}
									placeholder="Shown below the image..."
									className="h-9 bg-background text-sm"
								/>
								<p className="text-[11px] text-muted-foreground/70">
									Visible legend under the image.
								</p>
							</div>
						</div>
					</div>
				) : null}
				<div className="flex shrink-0 items-center justify-between gap-3 border-t bg-muted/30 px-6 py-4">
					<div className="flex min-w-0 items-center gap-3">
						{selectedImage ? (
							<>
								<div className="relative size-10 shrink-0 overflow-hidden rounded-lg border shadow-xs">
									<PrivateImage
										src={selectedImage.url}
										alt={selectedImage.name}
										className="h-full w-full object-cover"
									/>
									<span className="absolute right-0 bottom-0 flex size-3.5 items-center justify-center rounded-tl-md bg-primary text-primary-foreground">
										<IconCheck className="size-2.5" />
									</span>
								</div>
								<div className="min-w-0">
									<p className="truncate text-sm font-medium">
										{selectedImage.name}
									</p>
									<p className="text-[11px] text-muted-foreground">
										Ready to insert
									</p>
								</div>
							</>
						) : (
							<p className="text-xs text-muted-foreground/70">
								No image selected
							</p>
						)}
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<Button type="button" variant="ghost" onClick={handleClose}>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={() => {
								if (selectedImage) {
									onSelect(selectedImage, {
										alt: alt.trim(),
										caption: caption.trim(),
									});
									handleClose();
								}
							}}
							disabled={!selectedImage}
						>
							Insert Image
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
