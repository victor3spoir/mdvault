import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { PrivateImage } from "#/features/media/components/private-image";
import type { MediaFile } from "#/features/media/media.types";

interface MediaPreviewDialogProps {
	children: React.ReactNode;
	image: MediaFile;
}

export function MediaPreviewDialog({
	children,
	image,
}: MediaPreviewDialogProps) {
	const [copied, setCopied] = useState(false);

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-2xl overflow-hidden p-0">
				<div className="flex flex-col bg-card">
					<div className="relative flex h-80 items-center justify-center bg-muted/50">
						<PrivateImage
							src={image.url}
							alt={image.name}
							className="h-full w-full object-contain p-4"
						/>
					</div>

					<div className="space-y-4 border-t p-6">
						<DialogHeader className="space-y-2 text-left">
							<DialogTitle className="line-clamp-2 text-base">
								{image.name}
							</DialogTitle>
							<DialogDescription>
								Preview and copy the repository path for this asset.
							</DialogDescription>
						</DialogHeader>

						<div className="grid grid-cols-2 gap-4 py-2 text-xs">
							<div>
								<p className="font-semibold uppercase tracking-wide text-muted-foreground">
									File Type
								</p>
								<p className="mt-1 text-sm font-medium">
									{image.name.split(".").pop()?.toUpperCase()}
								</p>
							</div>
						</div>

						<div className="space-y-2">
							<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								URL
							</span>
							<div className="flex gap-2">
								<input
									type="text"
									value={image.url}
									readOnly
									className="h-9 flex-1 truncate rounded-lg border bg-muted/30 px-3 font-mono text-xs text-muted-foreground"
								/>
								<Button
									size="sm"
									variant="outline"
									className="h-9 w-9 p-0"
									onClick={async () => {
										await navigator.clipboard.writeText(image.url);
										setCopied(true);
										setTimeout(() => setCopied(false), 2000);
									}}
								>
									{copied ? (
										<IconCheck className="size-4 text-emerald-600" />
									) : (
										<IconCopy className="size-4" />
									)}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
