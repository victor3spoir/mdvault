import { IconCheck, IconPhoto, IconSearch } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { PrivateImage } from "#/features/media/components/private-image";
import { getImages } from "#/features/media/media.functions";
import type { MediaFile } from "#/features/media/media.types";
import { cn } from "#/lib/utils";

interface ImageSelectorProps {
	selectedImageUrl?: string;
	onSelectImage: (image: MediaFile) => void;
}

export function ImageSelector({
	selectedImageUrl = "",
	onSelectImage,
}: ImageSelectorProps) {
	const [images, setImages] = useState<MediaFile[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		setLoading(true);
		getImages()
			.then((data) => setImages(data))
			.catch(() => setImages([]))
			.finally(() => setLoading(false));
	}, []);

	const filteredImages = useMemo(
		() =>
			images.filter((image) =>
				image.name.toLowerCase().includes(searchQuery.toLowerCase()),
			),
		[images, searchQuery],
	);

	if (loading) {
		return (
			<div className="space-y-4">
				<div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
				<div className="grid grid-cols-[repeat(auto-fill,minmax(min(150px,100%),1fr))] gap-4">
					{["1", "2", "3", "4", "5", "6"].map((id) => (
						<Skeleton key={id} className="aspect-square rounded-2xl" />
					))}
				</div>
			</div>
		);
	}

	if (images.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 py-16 text-center">
				<div className="mb-4 rounded-2xl bg-muted p-4">
					<IconPhoto className="size-8 text-muted-foreground/50" />
				</div>
				<div className="space-y-1">
					<p className="text-sm font-semibold text-foreground">
						No images found
					</p>
					<p className="text-xs text-muted-foreground">
						Upload an image to get started
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<IconSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search images..."
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
						className="h-10 rounded-xl pl-10 text-sm"
					/>
				</div>
				<span className="shrink-0 rounded-full border bg-muted/40 px-2.5 py-1 font-mono text-[11px] tabular-nums text-muted-foreground">
					{filteredImages.length}/{images.length}
				</span>
			</div>

			<div className="overflow-y-auto pr-1">
				{filteredImages.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
						<p className="text-sm font-medium">No images match your search</p>
						<p className="text-xs text-muted-foreground">
							Try a different keyword
						</p>
					</div>
				) : (
					<div className="grid grid-cols-[repeat(auto-fill,minmax(min(140px,100%),1fr))] gap-3">
						{filteredImages.map((image) => (
							<button
								key={image.id}
								type="button"
								onClick={() => onSelectImage(image)}
								className={cn(
									"group relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
									selectedImageUrl === image.url
										? "border-primary ring-4 ring-primary/10 shadow-lg"
										: "border-transparent bg-muted/50 hover:border-primary/40 hover:shadow-md",
								)}
							>
								<PrivateImage
									src={image.url}
									alt={image.name}
									className={cn(
										"h-full w-full object-cover transition-transform duration-500 group-hover:scale-110",
										selectedImageUrl === image.url && "scale-105",
									)}
								/>
								<div
									className={cn(
										"absolute inset-0 transition-all duration-300",
										selectedImageUrl === image.url
											? "bg-primary/20"
											: "bg-black/0 group-hover:bg-black/5",
									)}
								/>
								{selectedImageUrl === image.url ? (
									<div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
										<IconCheck className="h-4 w-4" />
									</div>
								) : null}
								<div className="absolute inset-x-0 bottom-0 translate-y-full bg-linear-to-t from-black/80 to-transparent p-2 transition-transform duration-300 group-hover:translate-y-0">
									<p className="truncate text-[10px] font-medium text-white">
										{image.name}
									</p>
								</div>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
