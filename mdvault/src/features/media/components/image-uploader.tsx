import {
	IconAlertCircle,
	IconCheck,
	IconCloudUpload,
	IconFileDescription,
	IconLoader2,
	IconPhotoPlus,
	IconRefresh,
	IconTrash,
	IconUpload,
	IconX,
} from "@tabler/icons-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { compressImage } from "#/features/media/media.compress";
import { uploadImageMutation } from "#/features/media/media.functions";
import type { MediaFile } from "#/features/media/media.types";
import { cn } from "#/lib/utils";

interface UploadQueueItem {
	id: string;
	file: File;
	preview: string;
	error: string | null;
	uploaded: boolean;
	isUploading: boolean;
	uploadedSize: number | null;
}

interface ImageUploaderProps {
	maxSize?: number;
	onUploadSuccess?: (image: MediaFile) => void;
}

function formatBytes(bytes: number) {
	if (bytes < 1024) {
		return `${bytes} B`;
	}
	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(0)} KB`;
	}
	return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function fileToBase64(file: File) {
	const buffer = await file.arrayBuffer();
	let binary = "";
	for (const byte of new Uint8Array(buffer)) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}

export function ImageUploader({
	maxSize = 5,
	onUploadSuccess,
}: ImageUploaderProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [queue, setQueue] = useState<UploadQueueItem[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const validateFile = useCallback(
		(file: File) => {
			if (!file.type.startsWith("image/")) {
				return "Only image files are allowed";
			}
			if (file.size > maxSize * 1024 * 1024) {
				return `Larger than the ${maxSize}MB limit`;
			}
			return null;
		},
		[maxSize],
	);

	const handleFiles = useCallback(
		(files: FileList) => {
			const nextItems = Array.from(files).map((file, index) => {
				const error = validateFile(file);
				return {
					id: `${file.name}-${file.lastModified}-${Date.now()}-${index}`,
					file,
					preview: error ? "" : URL.createObjectURL(file),
					error,
					uploaded: false,
					isUploading: false,
					uploadedSize: null,
				};
			});

			setQueue((current) => [...current, ...nextItems]);
		},
		[validateFile],
	);

	const removeItem = (id: string) => {
		setQueue((current) => {
			const item = current.find((entry) => entry.id === id);
			if (item?.preview.startsWith("blob:")) {
				URL.revokeObjectURL(item.preview);
			}
			return current.filter((entry) => entry.id !== id);
		});
	};

	const clearAll = () => {
		setQueue((current) => {
			for (const item of current) {
				if (item.preview.startsWith("blob:")) {
					URL.revokeObjectURL(item.preview);
				}
			}
			return [];
		});
	};

	const patchItem = (id: string, patch: Partial<UploadQueueItem>) => {
		setQueue((current) =>
			current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
		);
	};

	const uploadOne = async (target: UploadQueueItem) => {
		patchItem(target.id, { isUploading: true, error: null });

		try {
			const prepared = await compressImage(target.file);
			const uploaded = await uploadImageMutation({
				data: {
					fileName: prepared.name,
					mimeType: prepared.type,
					base64: await fileToBase64(prepared),
				},
			});

			patchItem(target.id, {
				uploaded: true,
				isUploading: false,
				uploadedSize: prepared.size,
			});
			onUploadSuccess?.(uploaded);

			setTimeout(() => removeItem(target.id), 1400);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to upload image";
			patchItem(target.id, { isUploading: false, error: message });
			toast.error(message);
		}
	};

	const uploadAll = async () => {
		for (const item of queue) {
			if (!item.uploaded && !item.error && !item.isUploading) {
				await uploadOne(item);
			}
		}
	};

	const pendingItems = queue.filter(
		(item) => !item.uploaded && !item.error && !item.isUploading,
	);
	const totalSize = queue.reduce((sum, item) => sum + item.file.size, 0);
	const isBusy = queue.some((item) => item.isUploading);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-5">
			<button
				type="button"
				onDrop={(event) => {
					event.preventDefault();
					setIsDragging(false);
					if (event.dataTransfer.files) {
						handleFiles(event.dataTransfer.files);
					}
				}}
				onDragOver={(event) => {
					event.preventDefault();
					setIsDragging(true);
				}}
				onDragLeave={() => setIsDragging(false)}
				onClick={() => fileInputRef.current?.click()}
				className={cn(
					"group relative w-full shrink-0 cursor-pointer rounded-2xl border border-dashed p-8 text-center transition-colors",
					isDragging
						? "border-primary bg-primary/5"
						: "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50",
				)}
			>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					accept="image/*"
					onChange={(event) => {
						if (event.target.files) {
							handleFiles(event.target.files);
							event.target.value = "";
						}
					}}
					className="hidden"
				/>

				<div className="flex flex-col items-center gap-3">
					<span
						className={cn(
							"flex size-12 items-center justify-center rounded-xl border bg-background shadow-xs transition-colors",
							isDragging
								? "border-primary/40 text-primary"
								: "text-muted-foreground group-hover:text-primary",
						)}
					>
						<IconCloudUpload className="size-5" />
					</span>
					<div className="space-y-1">
						<p className="text-sm font-semibold">
							{isDragging ? "Drop to add files" : "Drag images here"}
						</p>
						<p className="text-xs text-muted-foreground">
							or <span className="text-primary">browse your device</span> · JPG,
							PNG, GIF, SVG, WebP · max {maxSize}MB
						</p>
					</div>
				</div>
			</button>

			{queue.length === 0 ? (
				<div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
					<IconPhotoPlus className="size-8 text-muted-foreground/30" />
					<p className="text-sm text-muted-foreground">No files queued yet.</p>
					<p className="text-xs text-muted-foreground/70">
						Images are optimized automatically before upload.
					</p>
				</div>
			) : (
				<div className="flex min-h-0 flex-1 flex-col gap-3">
					<div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
						<p className="text-xs font-medium text-muted-foreground">
							<span className="text-foreground">{queue.length}</span> file
							{queue.length > 1 ? "s" : ""} · {formatBytes(totalSize)}
						</p>
						<div className="flex items-center gap-2">
							<Button
								onClick={clearAll}
								variant="ghost"
								size="sm"
								disabled={isBusy}
								className="h-8 gap-1.5 rounded-lg text-xs text-muted-foreground hover:text-destructive"
							>
								<IconTrash className="size-3.5" />
								Clear
							</Button>
							<Button
								onClick={uploadAll}
								size="sm"
								disabled={pendingItems.length === 0 || isBusy}
								className="h-8 gap-1.5 rounded-lg text-xs"
							>
								{isBusy ? (
									<IconLoader2 className="size-3.5 animate-spin" />
								) : (
									<IconUpload className="size-3.5" />
								)}
								Upload {pendingItems.length > 0 ? pendingItems.length : ""}
							</Button>
						</div>
					</div>

					<div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
						{queue.map((item) => (
							<div
								key={item.id}
								className={cn(
									"flex items-center gap-3 rounded-xl border bg-card p-2.5 transition-colors",
									item.error && "border-destructive/30 bg-destructive/5",
									item.uploaded && "border-emerald-500/30 bg-emerald-500/5",
								)}
							>
								<div className="relative size-12 shrink-0 overflow-hidden rounded-lg border bg-muted">
									{item.preview ? (
										<img
											src={item.preview}
											alt=""
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center">
											<IconFileDescription className="size-5 text-muted-foreground/40" />
										</div>
									)}
									{item.isUploading ? (
										<div className="absolute inset-0 flex items-center justify-center bg-background/70">
											<IconLoader2 className="size-4 animate-spin text-primary" />
										</div>
									) : null}
								</div>

								<div className="min-w-0 flex-1">
									<p
										className="truncate text-sm font-medium"
										title={item.file.name}
									>
										{item.file.name}
									</p>
									<p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
										{item.error ? (
											<span className="flex items-center gap-1 text-destructive">
												<IconAlertCircle className="size-3.5" />
												{item.error}
											</span>
										) : item.uploaded ? (
											<span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
												<IconCheck className="size-3.5" />
												Uploaded
												{item.uploadedSize &&
												item.uploadedSize < item.file.size ? (
													<span className="text-muted-foreground">
														· {formatBytes(item.file.size)} →{" "}
														{formatBytes(item.uploadedSize)}
													</span>
												) : null}
											</span>
										) : item.isUploading ? (
											<span className="text-primary">Uploading...</span>
										) : (
											formatBytes(item.file.size)
										)}
									</p>
									{item.isUploading ? (
										<div className="mt-1.5 h-1 overflow-hidden rounded-full bg-primary/15">
											<div className="h-full w-full animate-pulse bg-primary/60" />
										</div>
									) : null}
								</div>

								<div className="flex shrink-0 items-center gap-0.5">
									{item.error ? (
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													onClick={() => uploadOne(item)}
													size="icon"
													variant="ghost"
													className="size-8 rounded-lg text-muted-foreground hover:text-primary"
												>
													<IconRefresh className="size-4" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>Retry</TooltipContent>
										</Tooltip>
									) : null}

									{!item.uploaded && !item.error ? (
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													onClick={() => uploadOne(item)}
													disabled={item.isUploading}
													size="icon"
													variant="ghost"
													className="size-8 rounded-lg text-muted-foreground hover:text-primary"
												>
													<IconUpload className="size-4" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>Upload this file</TooltipContent>
										</Tooltip>
									) : null}

									{!item.uploaded ? (
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													onClick={() => removeItem(item.id)}
													disabled={item.isUploading}
													variant="ghost"
													size="icon"
													className="size-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
												>
													<IconX className="size-4" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>Remove</TooltipContent>
										</Tooltip>
									) : null}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
