"use client";

import {
  IconCheck,
  IconCopy,
  IconEye,
  IconLoader2,
  IconPhotoOff,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import dynamic from "next/dynamic";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { checkMediaUsageAction, deleteImageAction } from "../medias.actions";
import type { MediaUsage, UploadedImage } from "../medias.types";

const Image = dynamic(() => import("next/image"), { ssr: false });

interface ImageGalleryProps {
  images: UploadedImage[];
  isLoading?: boolean;
  onImageDeleted?: (imageId: string) => void;
  onRefresh?: () => void;
}

export function ImageGallery({
  images,
  isLoading = false,
  onImageDeleted,
  onRefresh: _onRefresh,
}: ImageGalleryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedImageForPreview, setSelectedImageForPreview] =
    useState<UploadedImage | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    image: UploadedImage;
    usage: MediaUsage;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const copyUrlToClipboard = useCallback((url: string, imageId: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(imageId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleDeleteClick = async (image: UploadedImage) => {
    startTransition(async () => {
      try {
        const usage = await checkMediaUsageAction(image.url);
        setDeleteConfirmation({ image, usage });
      } catch (error) {
        toast.error("Failed to check image usage", {
          description:
            error instanceof Error ? error.message : "Try again later",
        });
      }
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation?.image) return;

    startTransition(async () => {
      try {
        await deleteImageAction(
          deleteConfirmation.image.id,
          deleteConfirmation.image.name,
          deleteConfirmation.image.sha || "",
        );
        toast.success("Image deleted", {
          description: `"${deleteConfirmation.image.name}" has been removed`,
        });
        setDeleteConfirmation(null);
        setSelectedImageForPreview(null);
        onImageDeleted?.(deleteConfirmation.image.id);
      } catch (error) {
        toast.error("Failed to delete image", {
          description:
            error instanceof Error ? error.message : "Try again later",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }, () => `skeleton-${Math.random()}`).map(
          (id) => (
            <div key={id} className="aspect-square rounded-lg bg-muted/30 animate-pulse" />
          ),
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-24 text-center">
          <div className="rounded-lg bg-muted/20 p-3 mb-3">
            <IconPhotoOff className="size-8 text-muted-foreground/60" />
          </div>
          <div className="max-w-sm space-y-1">
            <p className="text-sm font-semibold text-foreground">No media found</p>
            <p className="text-xs text-muted-foreground">
              Upload your first asset to get started
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted/20 transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <Image
                src={image.url}
                alt={image.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex flex-col items-center justify-center gap-2">
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="size-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                        onClick={() => setSelectedImageForPreview(image)}
                      >
                        <IconEye className="size-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Preview</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="size-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                        onClick={() => copyUrlToClipboard(image.url, image.id)}
                      >
                        {copiedId === image.id ? (
                          <IconCheck className="size-4" />
                        ) : (
                          <IconCopy className="size-4" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {copiedId === image.id ? "Copied!" : "Copy URL"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="size-9 rounded-lg bg-destructive/80 backdrop-blur flex items-center justify-center text-white hover:bg-destructive transition-colors"
                        onClick={() => handleDeleteClick(image)}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <IconLoader2 className="size-4 animate-spin" />
                        ) : (
                          <IconTrash className="size-4" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Filename label at bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                <p className="truncate text-xs font-medium text-white">
                  {image.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      <AlertDialog
        open={!!selectedImageForPreview}
        onOpenChange={(open) => {
          if (!open) setSelectedImageForPreview(null);
        }}
      >
        <AlertDialogContent className="max-w-2xl p-0 overflow-hidden">
          {selectedImageForPreview && (
            <div className="flex flex-col bg-card">
              {/* Image */}
              <div className="relative bg-muted/50 h-80 flex items-center justify-center">
                <Image
                  src={selectedImageForPreview.url}
                  alt={selectedImageForPreview.name}
                  fill
                  className="object-contain p-4"
                  priority
                  sizes="640px"
                />
                <button
                  type="button"
                  onClick={() => setSelectedImageForPreview(null)}
                  className="absolute right-4 top-4 size-8 rounded-lg bg-background/90 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
                >
                  <IconX className="size-4" />
                </button>
              </div>

              {/* Details */}
              <div className="border-t p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-base line-clamp-2">
                    {selectedImageForPreview.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Uploaded {new Date(selectedImageForPreview.uploadedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 text-xs">
                  <div>
                    <p className="font-semibold text-muted-foreground uppercase tracking-wide">File Type</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedImageForPreview.name.split(".").pop()?.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground uppercase tracking-wide">Size</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedImageForPreview.size
                        ? `${(selectedImageForPreview.size / 1024).toFixed(1)} KB`
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">URL</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedImageForPreview.url}
                      readOnly
                      className="flex-1 h-9 px-3 rounded-lg border bg-muted/30 text-xs text-muted-foreground font-mono truncate"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0"
                      onClick={() =>
                        copyUrlToClipboard(
                          selectedImageForPreview.url,
                          selectedImageForPreview.id,
                        )
                      }
                    >
                      {copiedId === selectedImageForPreview.id ? (
                        <IconCheck className="size-4 text-emerald-600" />
                      ) : (
                        <IconCopy className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleDeleteClick(selectedImageForPreview)}
                    disabled={isPending}
                    variant="destructive"
                    size="sm"
                  >
                    {isPending && (
                      <IconLoader2 className="size-3 animate-spin mr-2" />
                    )}
                    Delete Asset
                  </Button>
                  <Button
                    onClick={() => setSelectedImageForPreview(null)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirmation}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmation(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {deleteConfirmation?.usage.isUsed ? (
                <div className="space-y-3 mt-3">
                  <p className="text-destructive font-semibold text-sm">
                    ⚠️ In use by {deleteConfirmation.usage.usedInArticles.length} article(s)
                  </p>
                  <ul className="space-y-2">
                    {deleteConfirmation.usage.usedInArticles.map((article) => (
                      <li
                        key={article.slug}
                        className="text-sm text-muted-foreground pl-3 border-l-2 border-destructive/50"
                      >
                        {article.title}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    Deleting will break these articles. Continue?
                  </p>
                </div>
              ) : (
                <p className="text-sm">
                  Permanently delete &quot;{deleteConfirmation?.image.name}&quot;?
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex gap-2 justify-end pt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <IconLoader2 className="size-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
