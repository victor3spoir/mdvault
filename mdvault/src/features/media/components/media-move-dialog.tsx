import { useMutation, useQuery } from "@tanstack/react-query";
import { type ReactNode, useId, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { moveMediaMutation } from "#/features/media/media.functions";
import { mediaAuditQueryOptions } from "#/features/media/media.queries";
import type { MediaFile } from "#/features/media/media.types";
import { resolveMediaFolder } from "#/features/media/media-path";
import { useMediaRefresh } from "#/features/media/use-media-refresh";

export function MediaMoveDialog({
	children,
	images,
}: {
	children: ReactNode;
	images: MediaFile[];
}) {
	const [open, setOpen] = useState(false);
	const [folder, setFolder] = useState("");
	const id = useId();
	const refresh = useMediaRefresh();
	const audit = useQuery({ ...mediaAuditQueryOptions(), enabled: open });
	let folderError: string | undefined;
	try {
		resolveMediaFolder(folder, audit.data?.mediaRoot ?? "media");
	} catch (error) {
		folderError = error instanceof Error ? error.message : "Invalid folder";
	}
	const mutation = useMutation({
		mutationFn: () =>
			moveMediaMutation({
				data: {
					targets: images.map(({ path, sha }) => ({ path, sha })),
					folder,
				},
			}),
		onSuccess: async (result) => {
			setOpen(false);
			toast.success(
				`Moved ${result.moved} assets; updated ${result.updatedDocuments} documents.`,
			);
			await refresh();
		},
	});
	const references = new Set(
		images.flatMap(
			(image) =>
				audit.data?.usage[image.path]?.usedInEntries.map(
					(entry) => entry.path,
				) ?? [],
		),
	);
	const folders = [
		...new Set(
			Object.keys(audit.data?.usage ?? {}).map((path) =>
				path
					.slice((audit.data?.mediaRoot.length ?? 0) + 1)
					.split("/")
					.slice(0, -1)
					.join("/"),
			),
		),
	]
		.filter(Boolean)
		.sort();
	return (
		<AlertDialog
			open={open}
			onOpenChange={(value) => {
				if (!mutation.isPending) {
					setOpen(value);
					if (value) mutation.reset();
				}
			}}
		>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Move {images.length} {images.length === 1 ? "asset" : "assets"}
					</AlertDialogTitle>
					<AlertDialogDescription>
						Images and their references in articles, posts and Vault entries
						move together in one Git commit. External sites and unsaved drafts
						must be updated separately.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<FieldGroup>
					<Field data-invalid={!!folderError}>
						<FieldLabel htmlFor={id}>Destination folder</FieldLabel>
						<Input
							id={id}
							value={folder}
							onChange={(event) => setFolder(event.target.value)}
							placeholder="e.g. articles/tutorials"
							list={`${id}-folders`}
							disabled={mutation.isPending}
							aria-invalid={!!folderError}
							aria-describedby={`${id}-hint`}
						/>
						<datalist id={`${id}-folders`}>
							{folders.map((path) => (
								<option key={path} value={path} />
							))}
						</datalist>
						<FieldDescription id={`${id}-hint`}>
							{folderError ??
								`Relative to ${audit.data?.mediaRoot ?? "the media folder"}. Leave empty to move to the root. New folders are created automatically.`}
						</FieldDescription>
					</Field>
				</FieldGroup>
				{audit.isFetching ? (
					<p aria-live="polite" className="text-sm text-muted-foreground">
						Checking references…
					</p>
				) : audit.isError ? (
					<div role="alert">
						<p className="text-sm text-destructive">
							The scan failed. Moving is blocked.
						</p>
						<Button variant="outline" onClick={() => void audit.refetch()}>
							Retry scan
						</Button>
					</div>
				) : (
					<p className="text-sm text-muted-foreground">
						References in {references.size} documents will be updated. Existing
						destination files are never overwritten.
					</p>
				)}
				{mutation.isError ? (
					<p role="alert" className="text-sm text-destructive">
						{mutation.error.message}
					</p>
				) : null}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={mutation.isPending}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						disabled={
							mutation.isPending ||
							!!folderError ||
							audit.isFetching ||
							audit.isError ||
							!audit.data ||
							!images.length
						}
						onClick={(event) => {
							event.preventDefault();
							mutation.mutate();
						}}
					>
						{mutation.isPending ? "Moving…" : "Move assets"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
