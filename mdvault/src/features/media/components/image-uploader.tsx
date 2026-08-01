import {
	IconAlertCircle,
	IconCheck,
	IconFileDescription,
	IconLoader2,
	IconUpload,
	IconX,
} from "@tabler/icons-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { compressImage } from "#/features/media/media.compress";
import { uploadImageMutation } from "#/features/media/media.functions";
import type { MediaFile } from "#/features/media/media.types";

interface UploadQueueItem {
	file: File;
	preview: string;
	error: string | null;
	uploaded: boolean;
	isUploading: boolean;
}

interface ImageUploaderProps {
	maxSize?: number;
	onUploadSuccess?: (image: MediaFile) => void;
}

function abbreviateFilename(name: string) {
	const maxLength = 18;
	if (name.length <= maxLength) {
		return name;
	}

	const lastDot = name.lastIndexOf(".");
	const extension = lastDot > 0 ? name.slice(lastDot) : "";
	const availableForName = maxLength - extension.length - 3;

	if (availableForName <= 0) {
		return name.slice(0, maxLength);
	}

	const nameWithoutExt = lastDot > 0 ? name.slice(0, lastDot) : name;
	return `${nameWithoutExt.slice(0, availableForName)}...${extension}`;
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
				return `File size must be less than ${maxSize}MB`;
			}
			return null;
		},
		[maxSize],
	);

	const handleFiles = useCallback(
		(files: FileList) => {
			const nextItems = Array.from(files).map((file) => {
				const error = validateFile(file);
				return {
					file,
					preview: error ? "" : URL.createObjectURL(file),
					error,
					uploaded: false,
					isUploading: false,
				};
			});

			setQueue((current) => [...current, ...nextItems]);
		},
		[validateFile],
	);

	const removeFile = (file: File) => {
		setQueue((current) => {
			const item = current.find((entry) => entry.file === file);
			if (item?.preview.startsWith("blob:")) {
				URL.revokeObjectURL(item.preview);
			}
			return current.filter((entry) => entry.file !== file);
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

	const uploadOne = async (target: UploadQueueItem) => {
		setQueue((current) =>
			current.map((item) =>
				item.file === target.file
					? { ...item, isUploading: true, error: null }
					: item,
			),
		);

		try {
			const prepared = await compressImage(target.file);
			const uploaded = await uploadImageMutation({
				data: {
					fileName: prepared.name,
					mimeType: prepared.type,
					base64: await fileToBase64(prepared),
				},
			});

			setQueue((current) =>
				current.map((item) =>
					item.file === target.file
						? { ...item, uploaded: true, isUploading: false }
						: item,
				),
			);
			onUploadSuccess?.(uploaded);

			setTimeout(() => {
				removeFile(target.file);
			}, 1200);
		} catch (error) {
			setQueue((current) =>
				current.map((item) =>
					item.file === target.file
						? {
								...item,
								isUploading: false,
								error:
									error instanceof Error
										? error.message
										: "Failed to upload image",
							}
						: item,
				),
			);
			toast.error(
				error instanceof Error ? error.message : "Failed to upload image",
			);
		}
	};

	const uploadAll = async () => {
		for (const item of queue) {
			if (!item.uploaded && !item.error && !item.isUploading) {
				await uploadOne(item);
			}
		}
	};

	return (
		<TooltipProvider>
			<div className="space-y-6">
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
					className={`relative w-full cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
						isDragging
							? "border-primary bg-primary/5 ring-4 ring-primary/5"
							: "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30"
					}`}
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

					<div className="flex flex-col items-center gap-4">
						<div
							className={`rounded-2xl p-4 transition-colors ${
								isDragging ? "bg-primary/20" : "bg-muted/60"
							}`}
						>
							<IconUpload
								className={`size-8 ${
									isDragging
										? "animate-bounce text-primary"
										: "text-muted-foreground"
								}`}
							/>
						</div>
						<div className="space-y-1">
							<p className="text-base font-semibold text-foreground">
								{isDragging ? "Drop to upload" : "Click or drag images here"}
							</p>
							<p className="text-xs text-muted-foreground">
								Supports JPG, PNG, GIF, SVG, WebP, AVIF (Max {maxSize}MB)
							</p>
						</div>
					</div>
				</button>

				{queue.length > 0 ? (
					<div className="space-y-4">
						<div className="flex items-center justify-between px-1">
							<h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
								Upload Queue ({queue.length})
							</h3>
							<div className="flex gap-2">
								{queue.some(
									(item) => !item.uploaded && !item.error && !item.isUploading,
								) ? (
									<Button
										onClick={uploadAll}
										size="sm"
										variant="secondary"
										className="h-8 gap-2 rounded-lg text-xs"
									>
										<IconUpload className="size-3.5" />
										Upload All
									</Button>
								) : null}
								<Button
									onClick={clearAll}
									variant="ghost"
									size="sm"
									className="h-8 gap-2 rounded-lg text-xs text-muted-foreground hover:text-destructive"
								>
									<IconX className="size-3.5" />
									Clear All
								</Button>
							</div>
						</div>

						<div className="max-h-96 overflow-y-auto pr-2 pb-2">
							<div className="grid gap-3">
								{queue.map((item) => (
									<div
										key={`${item.file.name}-${item.file.lastModified}`}
										className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition-all hover:shadow-md"
									>
										<div className="relative size-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
											{item.preview ? (
												<img
													src={item.preview}
													alt={item.file.name}
													className="h-full w-full object-cover"
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center">
													<IconFileDescription className="size-6 text-muted-foreground/40" />
												</div>
											)}
										</div>

										<div className="min-w-0 flex-1 space-y-1.5 overflow-hidden">
											<div className="min-w-0">
												<p
													className="mb-1 truncate text-sm leading-none font-bold"
													title={item.file.name}
												>
													{abbreviateFilename(item.file.name)}
												</p>
												<p className="text-[10px] font-medium text-muted-foreground">
													{(item.file.size / 1024 / 1024).toFixed(2)} MB
												</p>
											</div>

											<div className="flex flex-wrap items-center gap-1.5">
												{item.uploaded ? (
													<Badge
														variant="secondary"
														className="h-5 gap-1 border-green-500/20 bg-green-500/10 px-1.5 py-0 text-[10px] text-green-600"
													>
														<IconCheck className="size-3" />
														Done
													</Badge>
												) : null}
												{item.error ? (
													<Badge
														variant="destructive"
														className="h-5 gap-1 px-1.5 py-0 text-[10px]"
													>
														<IconAlertCircle className="size-3" />
														Error
													</Badge>
												) : null}
												{item.isUploading ? (
													<Badge variant="outline" className="h-5 text-[10px]">
														Uploading...
													</Badge>
												) : null}
											</div>

											{item.error ? (
												<p className="text-[10px] font-medium text-destructive">
													{item.error}
												</p>
											) : null}
										</div>

										<div className="ml-auto flex shrink-0 items-center gap-1">
											{!item.uploaded ? (
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															onClick={() => uploadOne(item)}
															disabled={item.isUploading || !!item.error}
															size="icon"
															variant="ghost"
															className="size-8 rounded-lg text-primary hover:bg-primary/10"
														>
															{item.isUploading ? (
																<IconLoader2 className="size-4 animate-spin" />
															) : (
																<IconUpload className="size-4" />
															)}
														</Button>
													</TooltipTrigger>
													<TooltipContent>Upload</TooltipContent>
												</Tooltip>
											) : null}

											{item.error ? (
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															onClick={() =>
																setQueue((current) =>
																	current.map((entry) =>
																		entry.file === item.file
																			? { ...entry, error: null }
																			: entry,
																	),
																)
															}
															size="icon"
															variant="ghost"
															className="size-8 rounded-lg text-primary hover:bg-primary/10"
														>
															<IconUpload className="size-4" />
														</Button>
													</TooltipTrigger>
													<TooltipContent>Reset error</TooltipContent>
												</Tooltip>
											) : null}

											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														onClick={() => removeFile(item.file)}
														variant="ghost"
														size="icon"
														className="size-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
													>
														<IconX className="size-4" />
													</Button>
												</TooltipTrigger>
												<TooltipContent>Remove</TooltipContent>
											</Tooltip>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				) : null}
			</div>
		</TooltipProvider>
	);
}
