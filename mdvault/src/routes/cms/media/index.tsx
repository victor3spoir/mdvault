import { IconRefresh } from "@tabler/icons-react";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { PageLayout } from "#/components/page-layout";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Skeleton } from "#/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { MediaFilters } from "#/features/media/components/media-filters";
import { MediaGallery } from "#/features/media/components/media-gallery";
import { MediaHealth } from "#/features/media/components/media-health";
import { MediaUploadSheet } from "#/features/media/components/media-upload-sheet";
import { deleteMediaMutation } from "#/features/media/media.functions";
import {
	mediaAuditQueryOptions,
	mediaListQueryOptions,
} from "#/features/media/media.queries";
import type { MediaFile } from "#/features/media/media.types";
import { useMediaRefresh } from "#/features/media/use-media-refresh";

const searchSchema = z.object({
	search: z.string().catch("").default(""),
	format: z.string().catch("all").default("all"),
	folder: z.string().catch("all").default("all"),
	view: z.enum(["all", "unused", "missing"]).catch("all").default("all"),
});

export const Route = createFileRoute("/cms/media/")({
	validateSearch: zodValidator(searchSchema),
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(mediaListQueryOptions()),
	pendingComponent: MediaPending,
	component: MediaPage,
});

function MediaPage() {
	const { data: images } = useSuspenseQuery(mediaListQueryOptions());
	const filters = Route.useSearch();
	const navigate = Route.useNavigate();
	const refresh = useMediaRefresh();
	const [scanEnabled, setScanEnabled] = useState(false);
	const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
	const audit = useQuery({
		...mediaAuditQueryOptions(),
		enabled: scanEnabled || filters.view !== "all",
	});
	const remove = useMutation({
		mutationFn: (targets: MediaFile[]) =>
			deleteMediaMutation({
				data: targets.map(({ path, sha }) => ({ path, sha })),
			}),
		onSuccess: async (_, targets) => {
			setSelectedPaths((current) =>
				current.filter(
					(path) => !targets.some((target) => target.path === path),
				),
			);
			toast.success("Assets deleted. They remain recoverable in Git history.");
			await refresh();
		},
	});
	const setFilters = (patch: Partial<typeof filters>) => {
		setSelectedPaths([]);
		void navigate({
			search: (previous) => ({ ...previous, ...patch }),
			replace: true,
		});
	};
	const imageTypes = [
		...new Set(
			images.map((image) =>
				(image.name.split(".").at(-1)?.toLowerCase() ?? "unknown").replace(
					"jpeg",
					"jpg",
				),
			),
		),
	].sort();
	const folders = [
		...new Set(
			images.map((image) => image.path.split("/").slice(0, -1).join("/")),
		),
	].sort();
	const unusedPaths = new Set(audit.data?.unusedPaths ?? []);
	const visible = images.filter((image) => {
		const extension = (
			image.name.split(".").at(-1)?.toLowerCase() ?? ""
		).replace("jpeg", "jpg");
		return (
			image.path.toLowerCase().includes(filters.search.toLowerCase()) &&
			(filters.format === "all" || extension === filters.format) &&
			(filters.folder === "all" ||
				image.path.split("/").slice(0, -1).join("/") === filters.folder) &&
			(filters.view !== "unused" || unusedPaths.has(image.path))
		);
	});
	return (
		<PageLayout
			title="Media Library"
			description="Upload, organize, and reuse images across your content."
			actions={
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={audit.isFetching}
						onClick={() => {
							setScanEnabled(true);
							void audit.refetch();
						}}
					>
						<IconRefresh data-icon="inline-start" />
						{audit.isFetching ? "Scanning…" : "Scan usage"}
					</Button>
					<MediaUploadSheet
						onUploadSuccess={() => {
							toast.success("Image uploaded");
							void refresh();
						}}
					/>
				</div>
			}
		>
			<Tabs
				value={filters.view}
				onValueChange={(view) =>
					setFilters({ view: view as typeof filters.view })
				}
				className="gap-5"
			>
				<TabsList aria-label="Media view" className="max-w-full">
					<TabsTrigger value="all">All ({images.length})</TabsTrigger>
					<TabsTrigger value="unused">
						Unused{audit.data ? ` (${audit.data.unusedPaths.length})` : ""}
					</TabsTrigger>
					<TabsTrigger value="missing">
						Missing{audit.data ? ` (${audit.data.missing.length})` : ""}
					</TabsTrigger>
				</TabsList>
				{audit.isError ? (
					<Alert variant="destructive">
						<AlertTitle>Usage scan unavailable</AlertTitle>
						<AlertDescription>
							<p>{audit.error.message}</p>
							<p>
								No assets are marked safe to delete until a complete scan
								succeeds.
							</p>
							<Button
								variant="outline"
								size="sm"
								onClick={() => void audit.refetch()}
							>
								Retry scan
							</Button>
						</AlertDescription>
					</Alert>
				) : audit.isFetching ? (
					<div aria-busy="true" className="flex flex-col gap-2">
						<p className="text-sm text-muted-foreground">
							Scanning articles, posts and Vault content…
						</p>
						<Skeleton className="h-4 w-72 max-w-full" />
					</div>
				) : audit.data ? (
					<p className="text-sm text-muted-foreground">
						Scanned {audit.data.documentCount} documents. External sites,
						unsaved drafts and other branches are not included. Code examples
						count as references.
					</p>
				) : null}
				{(["all", "unused"] as const).map((view) => (
					<TabsContent key={view} value={view} className="flex flex-col gap-5">
						{view === "unused" ? (
							<p className="text-sm text-muted-foreground">
								No references found in managed content. Check external usage
								before deleting.
							</p>
						) : null}
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start">
							<div className="min-w-0 flex-1">
								<MediaFilters
									imageTypes={imageTypes}
									search={filters.search}
									filter={filters.format}
									onSearchChange={(search) => setFilters({ search })}
									onFilterChange={(format) => setFilters({ format })}
								/>
							</div>
							<Select
								value={filters.folder}
								onValueChange={(folder) => setFilters({ folder })}
							>
								<SelectTrigger
									aria-label="Media folder"
									className="w-full sm:w-56"
								>
									<SelectValue placeholder="All folders" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="all">All folders</SelectItem>
										{folders.map((folder) => (
											<SelectItem key={folder} value={folder}>
												{folder}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						{view === "all" || (audit.data && !audit.isError) ? (
							<MediaGallery
								media={visible}
								selectedPaths={selectedPaths}
								onSelectionChange={setSelectedPaths}
								onDelete={async (targets) => {
									await remove.mutateAsync(targets);
								}}
								pending={remove.isPending}
							/>
						) : null}
					</TabsContent>
				))}
				<TabsContent value="missing">
					{audit.data && !audit.isError ? (
						<MediaHealth audit={audit.data} />
					) : null}
				</TabsContent>
			</Tabs>
		</PageLayout>
	);
}

function MediaPending() {
	return (
		<PageLayout title="Media Library" description="Loading your media library…">
			<div aria-busy="true" className="flex flex-col gap-5">
				<Skeleton className="h-9 w-72 max-w-full" />
				<Skeleton className="h-11 w-full" />
				<div className="grid grid-cols-[repeat(auto-fill,minmax(min(180px,100%),1fr))] gap-4">
					{[1, 2, 3, 4, 5, 6].map((id) => (
						<Skeleton key={id} className="aspect-square rounded-xl" />
					))}
				</div>
			</div>
		</PageLayout>
	);
}
