import { useCallback, useRef, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "#/components/ui/alert-dialog";

export interface ConfirmOptions {
	title: string;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	/** Destructive actions get a red confirm button. Defaults to true. */
	destructive?: boolean;
}

/**
 * Promise based replacement for `window.confirm`. Render `confirmDialog` once,
 * then await `confirm(...)` inside a handler.
 */
export function useConfirm() {
	const [options, setOptions] = useState<ConfirmOptions | null>(null);
	const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

	const settle = useCallback((confirmed: boolean) => {
		resolverRef.current?.(confirmed);
		resolverRef.current = null;
		setOptions(null);
	}, []);

	const confirm = useCallback((next: ConfirmOptions) => {
		resolverRef.current?.(false);
		setOptions(next);

		return new Promise<boolean>((resolve) => {
			resolverRef.current = resolve;
		});
	}, []);

	const confirmDialog = (
		<AlertDialog
			open={options !== null}
			onOpenChange={(open) => {
				if (!open) {
					settle(false);
				}
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{options?.title}</AlertDialogTitle>
					{options?.description ? (
						<AlertDialogDescription>
							{options.description}
						</AlertDialogDescription>
					) : null}
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={() => settle(false)}>
						{options?.cancelLabel ?? "Cancel"}
					</AlertDialogCancel>
					<AlertDialogAction
						variant={options?.destructive === false ? "default" : "destructive"}
						onClick={() => settle(true)}
					>
						{options?.confirmLabel ?? "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);

	return { confirm, confirmDialog };
}

/** Shared wording so every delete keeps the reassurance that git has a copy. */
export const DELETE_DESCRIPTION =
	"This removes the file from your repository. The change is committed and can still be recovered from git history.";
