import { IconFileText } from "@tabler/icons-react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { PageLayout } from "#/components/page-layout";
import { MediaFilters } from "#/features/media/components/media-filters";
import { MediaGallery } from "#/features/media/components/media-gallery";
import { MediaUploadSheet } from "#/features/media/components/media-upload-sheet";
import {
	deleteImageMutation,
	getImages,
} from "#/features/media/media.functions";
import type { MediaFile } from "#/features/media/media.types";

export const Route = createFileRoute("/cms/media/")({
	loader: () => getImages(),
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

	const stats = [
		{ title: "Total Assets", value: images.length },
		{ title: "File Types", value: imageTypes.length },
	] as const;

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
			description="Manage your digital assets"
		>
			<div className="space-y-6">
				<div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
					{stats.map((stat) => (
						<div
							key={stat.title}
							className="rounded-xl border bg-card/50 p-4 backdrop-blur-sm"
						>
							<p className="text-sm font-medium text-muted-foreground">
								{stat.title}
							</p>
							<p className="mt-2 text-3xl font-bold text-foreground">
								{stat.value}
							</p>
						</div>
					))}
				</div>

				<MediaUploadSheet
					onUploadSuccess={(image) => {
						setImages((current) => [image, ...current]);
						router.invalidate();
						toast.success("Image uploaded");
					}}
				/>

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
