import { IconFileText } from "@tabler/icons-react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { PageLayout } from "#/components/page-layout";
import { Badge } from "#/components/ui/badge";
import { Skeleton } from "#/components/ui/skeleton";
import { MediaFilters } from "#/features/media/components/media-filters";
import { MediaGallery } from "#/features/media/components/media-gallery";
import { MediaUploadSheet } from "#/features/media/components/media-upload-sheet";
import { deleteImageMutation } from "#/features/media/media.functions";
import { mediaListQueryOptions } from "#/features/media/media.queries";
import type { MediaFile } from "#/features/media/media.types";

export const Route = createFileRoute("/cms/media/")({
	loader: async ({ context }) => {
		const images = await context.queryClient.ensureQueryData(
			mediaListQueryOptions(),
		);
		return images;
	},
	pendingComponent: MediaPending,
	component: MediaPage,
});

function MediaPage() {
	const initialImages = Route.useLoaderData();
	const router = useRouter();
	const [images, setImages] = useState(initialImages);
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState("all");
	const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
	const [isPending, startTransition] = useTransition();

	const imageTypes = useMemo(
		() =>
			Array.from(
				new Set(
					images.map((image) => {
						const ext = image.name.split(".").pop()?.toLowerCase() || "unknown";
						return ext === "jpeg" ? "jpg" : ext;
					}),
				),
			).sort(),
		[images],
	);

	const deleteImages = async (targets: MediaFile[]) => {
		for (const target of targets) {
			await deleteImageMutation({
				data: { fileName: target.name, sha: target.sha },
			});
		}

		setImages((current) =>
			current.filter(
				(image) => !targets.some((target) => target.path === image.path),
			),
		);
		setSelectedPaths((current) =>
			current.filter((path) => !targets.some((target) => target.path === path)),
		);
		router.invalidate();
		toast.success(targets.length > 1 ? "Assets deleted" : "Asset deleted");
	};

	return (
		<PageLayout
			title="Media Library"
			description="Upload, organize, and reuse the images across your content."
			actions={
				<div className="flex items-center gap-2">
					<Badge
						variant="secondary"
						className="hidden h-6 rounded-lg px-2 text-xs font-bold sm:flex"
					>
						{images.length} Assets
					</Badge>
					<MediaUploadSheet
						onUploadSuccess={(image) => {
							setImages((current) => [image, ...current]);
							router.invalidate();
							toast.success("Image uploaded");
						}}
					/>
				</div>
			}
		>
			<div className="space-y-6">
				<MediaFilters
					imageTypes={imageTypes}
					search={search}
					filter={filter}
					onSearchChange={setSearch}
					onFilterChange={setFilter}
				/>

				<div className="min-h-96">
					<MediaGallery
						media={images}
						search={search}
						filter={filter}
						selectedPaths={selectedPaths}
						onToggleSelect={(path, checked) =>
							setSelectedPaths((current) =>
								checked
									? [...new Set([...current, path])]
									: current.filter((value) => value !== path),
							)
						}
						onClearSelection={() => setSelectedPaths([])}
						onDelete={(image) =>
							new Promise<void>((resolve, reject) => {
								startTransition(async () => {
									try {
										await deleteImages([image]);
										resolve();
									} catch (error) {
										reject(error);
									}
								});
							})
						}
						onDeleteMany={(targets) =>
							new Promise<void>((resolve, reject) => {
								startTransition(async () => {
									try {
										await deleteImages(targets);
										resolve();
									} catch (error) {
										reject(error);
									}
								});
							})
						}
					/>
				</div>

				{isPending ? (
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<IconFileText className="size-3.5" />
						Syncing media changes...
					</div>
				) : null}
			</div>
		</PageLayout>
	);
}

function MediaPending() {
	return (
		<PageLayout title="Media" description="Loading your media library...">
			<div className="grid grid-cols-[repeat(auto-fill,minmax(min(200px,100%),1fr))] gap-4">
				{[
					"media-skeleton-1",
					"media-skeleton-2",
					"media-skeleton-3",
					"media-skeleton-4",
					"media-skeleton-5",
					"media-skeleton-6",
					"media-skeleton-7",
					"media-skeleton-8",
				].map((id) => (
					<div key={id} className="overflow-hidden rounded-2xl border">
						<Skeleton className="aspect-square rounded-none" />
						<div className="space-y-2 p-4">
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-3 w-1/2" />
						</div>
					</div>
				))}
			</div>
		</PageLayout>
	);
}
