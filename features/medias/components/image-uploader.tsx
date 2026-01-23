"use client";

import {
  IconAlertCircle,
  IconCheck,
  IconFileDescription,
  IconLoader2,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";
import { useCallback, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { uploadImageAction } from "../medias.actions";

interface ImageFile {
  file: File;
  preview: string;
  progress: number;
  error: string | null;
  uploaded: boolean;
}

interface ImageUploaderProps {
  maxSize?: number; // in MB
}

export function ImageUploader({
  maxSize = 3,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<ImageFile[]>([]);
  const [isPending, startTransition] = useTransition();
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
      const fileArray = Array.from(files);
      fileArray.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          setUploadedFiles((prev) => [
            ...prev,
            {
              file,
              preview: "",
              progress: 0,
              error,
              uploaded: false,
            },
          ]);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setUploadedFiles((prev) => [
            ...prev,
            {
              file,
              preview: dataUrl,
              progress: 0,
              error: null,
              uploaded: false,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
    },
    [validateFile],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleUpload = (imageFile: ImageFile) => {
    startTransition(async () => {
      try {
        const result = await uploadImageAction(imageFile.file);
        if (result.success) {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.file === imageFile.file
                ? { ...f, progress: 100, uploaded: true }
                : f,
            ),
          );

          // Remove from list after 2 seconds and trigger complete callback
          setTimeout(() => {
            setUploadedFiles((prev) => {
              const updated = prev.filter((f) => f.file !== imageFile.file);
              return updated;
            });
          }, 2000);
        } else {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.file === imageFile.file ? { ...f, error: result.error } : f,
            ),
          );
        }
      } catch (error) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file === imageFile.file
              ? {
                  ...f,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Failed to upload",
                }
              : f,
          ),
        );
      }
    });
  };

  const handleRetry = (imageFile: ImageFile) => {
    // Reset error state and progress
    setUploadedFiles((prev) =>
      prev.map((f) =>
        f.file === imageFile.file ? { ...f, error: null, progress: 0 } : f,
      ),
    );
    // Start upload
    handleUpload(imageFile);
  };

  const removeFile = (file: File) => {
    setUploadedFiles((prev) => prev.filter((f) => f.file !== file));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Drop Zone */}
        <button
          type="button"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer p-10 text-center group ${isDragging
            ? "border-primary bg-primary/5 ring-4 ring-primary/5"
            : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30"
            }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            disabled={isPending}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            <div
              className={`rounded-2xl p-4 transition-colors ${isDragging ? "bg-primary/20" : "bg-muted group-hover:bg-primary/10"}`}
            >
              <IconUpload
                className={`size-8 transition-colors ${isDragging ? "text-primary animate-bounce" : "text-muted-foreground group-hover:text-primary"}`}
              />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {isDragging ? "Drop to upload" : "Click or drag images here"}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports JPG, PNG, GIF, SVG, WebP (Max {maxSize}MB)
              </p>
            </div>
          </div>
        </button>

        {uploadedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Upload Queue ({uploadedFiles.length})
              </h3>
              <div className="flex gap-2">
                {uploadedFiles.some((f) => !f.uploaded && !f.error) && (
                  <Button
                    onClick={() => {
                      const toUpload = uploadedFiles.filter(
                        (f) => !f.uploaded && !f.error,
                      );
                      toUpload.forEach((f) => {
                        handleUpload(f);
                      });
                    }}
                    disabled={isPending}
                    size="sm"
                    variant="secondary"
                    className="h-8 gap-2 text-xs rounded-lg"
                  >
                    <IconUpload className="size-3.5" />
                    Upload All
                  </Button>
                )}
                <Button
                  onClick={clearAllFiles}
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 text-xs text-muted-foreground hover:text-destructive rounded-lg"
                >
                  <IconX className="size-3.5" />
                  Clear All
                </Button>
              </div>
            </div>

            <div className="grid gap-3">
              {uploadedFiles.map((item) => (
                <div
                  key={item.file.name + item.file.lastModified}
                  className="group relative flex items-center gap-4 rounded-xl border bg-card p-3 shadow-sm transition-all hover:shadow-md"
                >
                  {/* Image Preview */}
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted border">
                    {item.preview ? (
                      <Image
                        src={item.preview}
                        alt={item.file.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <IconFileDescription className="size-6 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* File Info and Progress */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate leading-none mb-1">
                          {item.file.name}
                        </p>
                        <p className="text-[10px] font-medium text-muted-foreground">
                          {(item.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.uploaded && (
                          <Badge
                            variant="secondary"
                            className="bg-green-500/10 text-green-600 border-green-500/20 gap-1 px-1.5 py-0 h-5 text-[10px]"
                          >
                            <IconCheck className="size-3" />
                            Done
                          </Badge>
                        )}
                        {item.error && (
                          <Badge
                            variant="destructive"
                            className="gap-1 px-1.5 py-0 h-5 text-[10px]"
                          >
                            <IconAlertCircle className="size-3" />
                            Error
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(item.progress > 0 ||
                      (isPending && !item.uploaded && !item.error)) && (
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full transition-all duration-500 ${item.error
                              ? "bg-destructive"
                              : item.progress === 100
                                ? "bg-green-500"
                                : "bg-primary animate-pulse"
                              }`}
                            style={{
                              width: `${item.progress || (isPending ? 40 : 0)}%`,
                            }}
                          />
                        </div>
                      )}

                    {item.error && (
                      <p className="text-[10px] font-medium text-destructive">
                        {item.error}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!item.uploaded && !item.error && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => handleUpload(item)}
                            disabled={isPending}
                            size="icon"
                            variant="ghost"
                            className="size-8 rounded-lg text-primary hover:bg-primary/10"
                          >
                            {isPending ? (
                              <IconLoader2 className="size-4 animate-spin" />
                            ) : (
                              <IconUpload className="size-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Upload</TooltipContent>
                      </Tooltip>
                    )}

                    {item.error && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => handleRetry(item)}
                            disabled={isPending}
                            size="icon"
                            variant="ghost"
                            className="size-8 rounded-lg text-primary hover:bg-primary/10"
                          >
                            <IconUpload className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Retry</TooltipContent>
                      </Tooltip>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => removeFile(item.file)}
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
        )}
      </div>
    </TooltipProvider>
  );
}
