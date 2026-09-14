import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useState, useTransition } from "react";
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
import { Skeleton } from "#/components/ui/skeleton";
import { mediaAuditQueryOptions } from "#/features/media/media.queries";
import type { MediaFile } from "#/features/media/media.types";
import { MediaUsageLinks } from "./media-usage-links";

interface MediaDeleteDialogProps {
	children?: ReactNode;
	image?: MediaFile;
	images?: MediaFile[];
	onConfirm: (images: MediaFile[]) => Promise<void> | void;
}

export function MediaDeleteDialog({
	children,
	image,
	images,
	onConfirm,
}: MediaDeleteDialogProps) {
	const targets = images ?? (image ? [image] : []);
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const audit = useQuery({ ...mediaAuditQueryOptions(), enabled: open });
	const used = targets.filter(
		(target) => audit.data?.usage[target.path]?.isUsed,
	);
	const unknown = targets.some((target) => !audit.data?.usage[target.path]);
	const blocked =
		!targets.length ||
		unknown ||
		used.length > 0 ||
		audit.isFetching ||
		audit.isError;

	return (
		<AlertDialog
			open={open}
			onOpenChange={(value) => {
				if (!isPending) setOpen(value);
			}}
		>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Delete {targets.length > 1 ? `${targets.length} assets` : "asset"}?
					</AlertDialogTitle>
					<AlertDialogDescription>
						Only assets with no references in articles, posts or Vault entries
						can be deleted. External sites and unsaved drafts are not scanned.
						You can recover files from Git history.
					</AlertDialogDescription>
				</AlertDialogHeader>
				{audit.isFetching ? (
					<div aria-busy="true" className="flex flex-col gap-2">
						<p className="text-sm text-muted-foreground">
							Checking media usage…
						</p>
						<Skeleton className="h-5 w-full" />
					</div>
				) : audit.isError ? (
					<div role="alert" className="flex flex-col gap-2">
						<p className="text-sm text-destructive">
							Usage could not be verified. Deletion is blocked.
						</p>
						<Button variant="outline" onClick={() => void audit.refetch()}>
							Retry scan
						</Button>
					</div>
				) : used.length ? (
					<div className="max-h-64 overflow-y-auto">
						<p className="mb-3 text-sm font-medium">
							Remove these references before deleting:
						</p>
						<ul className="flex flex-col gap-3">
							{used.map((target) => (
								<li key={target.path}>
									<p className="break-all text-sm font-medium">{target.path}</p>
									<MediaUsageLinks
										entries={
											audit.data?.usage[target.path]?.usedInEntries ?? []
										}
									/>
								</li>
							))}
						</ul>
					</div>
				) : unknown ? (
					<p role="alert" className="text-sm text-destructive">
						Some assets changed or could not be checked. Refresh the library.
					</p>
				) : (
					<p className="text-sm">
						No references found in managed content. Usage will be checked again
						before deletion.
					</p>
				)}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={blocked || isPending}
						onClick={(event) => {
							event.preventDefault();
							startTransition(async () => {
								try {
									await onConfirm(targets);
									setOpen(false);
								} catch (error) {
									toast.error(
										error instanceof Error
											? error.message
											: "Could not delete media",
									);
								}
							});
						}}
					>
						{isPending ? "Deleting…" : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
