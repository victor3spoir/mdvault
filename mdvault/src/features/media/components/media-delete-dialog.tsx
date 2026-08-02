import { IconLoader2 } from "@tabler/icons-react";
import { useEffect, useMemo, useState, useTransition } from "react";
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
import { checkMediaUsageFn } from "#/features/media/media.functions";
import type { MediaFile, MediaUsage } from "#/features/media/media.types";

interface MediaDeleteDialogProps {
	children: React.ReactNode;
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
	const targets = useMemo(
		() => images ?? (image ? [image] : []),
		[image, images],
	);
	const [open, setOpen] = useState(false);
	const [usage, setUsage] = useState<Record<string, MediaUsage>>({});
	const [isLoadingUsage, setIsLoadingUsage] = useState(false);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		if (!open || targets.length === 0) {
			setUsage((current) => (Object.keys(current).length === 0 ? current : {}));
			setIsLoadingUsage(false);
			return;
		}

		let cancelled = false;
		setIsLoadingUsage(true);
		Promise.all(
			targets.map(async (target) => {
				try {
					const result = await checkMediaUsageFn({
						data: { imageUrl: target.url },
					});
					return [target.path, result] as const;
				} catch {
					return [target.path, { isUsed: false, usedInEntries: [] }] as const;
				}
			}),
		)
			.then((entries) => {
				if (!cancelled) {
					setUsage(Object.fromEntries(entries));
				}
			})
			.finally(() => {
				if (!cancelled) {
					setIsLoadingUsage(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [open, targets]);

	const usedTargets = targets.filter((target) => usage[target.path]?.isUsed);

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{targets.length > 1 ? "Delete selected assets" : "Delete asset"}
					</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className="space-y-3 pt-2 text-sm">
							{isLoadingUsage ? (
								<div className="flex items-center gap-2">
									<IconLoader2 className="size-4 animate-spin" />
									<span>Checking media usage...</span>
								</div>
							) : (
								<>
									<p>
										{targets.length > 1
											? `You are about to delete ${targets.length} assets.`
											: `Permanently delete "${targets[0]?.name}"?`}
									</p>
									{usedTargets.length > 0 ? (
										<div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
											<p className="font-medium text-destructive">
												Some selected assets are currently in use.
											</p>
											<ul className="space-y-2">
												{usedTargets.map((target) => (
													<li key={target.path}>
														<p className="font-medium text-foreground">
															{target.name}
														</p>
														<ul className="mt-1 space-y-1 text-muted-foreground">
															{usage[target.path]?.usedInEntries.map(
																(entry) => (
																	<li
																		key={`${target.path}-${entry.type}-${entry.id}`}
																	>
																		{entry.type}: {entry.title}
																	</li>
																),
															)}
														</ul>
													</li>
												))}
											</ul>
										</div>
									) : null}
								</>
							)}
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
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
											: "Failed to delete assets",
									);
								}
							});
						}}
						disabled={isPending || isLoadingUsage}
					>
						{isPending ? (
							<>
								<IconLoader2 className="mr-2 size-4 animate-spin" />
								Deleting...
							</>
						) : targets.length > 1 ? (
							"Delete Selected"
						) : (
							"Delete"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
