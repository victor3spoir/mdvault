import { IconLoader2 } from "@tabler/icons-react";
import { Skeleton } from "#/components/ui/skeleton";

interface EditorLoadingProps {
	/** Show a skeleton toolbar strip above the message (rich editor). */
	withToolbar?: boolean;
}

export function EditorLoading({ withToolbar = false }: EditorLoadingProps) {
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			{withToolbar ? (
				<div className="flex shrink-0 items-center justify-center gap-1.5 border-b px-3 py-2">
					{Array.from({ length: 10 }, (_, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static placeholder strip
						<Skeleton key={index} className="size-7 rounded-lg" />
					))}
				</div>
			) : null}

			<div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
				<div className="relative">
					<div className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
					<div className="relative flex size-14 items-center justify-center rounded-2xl border bg-card shadow-sm">
						<IconLoader2 className="size-6 animate-spin text-primary" />
					</div>
				</div>
				<div className="space-y-1 text-center">
					<p className="text-sm font-medium">Setting up your editor</p>
					<p className="text-xs text-muted-foreground">
						This should only take a moment...
					</p>
				</div>
			</div>
		</div>
	);
}
