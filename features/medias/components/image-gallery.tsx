"use client";

import { IconCheck, IconCopy, IconEye, IconX, IconTrash, IconLoader2, IconPhotoOff } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { UploadedImage, MediaUsage } from "../medias.types";
import { checkMediaUsageAction, deleteImageAction } from "../medias.actions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Image = dynamic(() => import("next/image"), { ssr: false });

interface ImageGalleryProps {
  images: UploadedImage[];
  isLoading?: boolean;
  onImageDeleted?: (imageId: string) => void;
}

export function ImageGallery({ images, isLoading = false, onImageDeleted }: ImageGalleryProps) {
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
          description: error instanceof Error ? error.message : "Try again later",
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
          description: error instanceof Error ? error.message : "Try again later",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(150px,100%),1fr))]">
        {Array.from({ length: 6 }, () => `skeleton-${Math.random()}`).map(
          (id) => (
            <div
              key={id}
              className="aspect-square rounded-lg bg-muted animate-pulse"
            />
          ),
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/20 py-20 text-center bg-muted/5">
          <div className="rounded-full bg-muted/10 p-4 mb-4">
            <IconPhotoOff className="size-10 text-muted-foreground/40" />
          </div>
          <div className="max-w-50 space-y-1">
            <p className="text-sm font-medium text-foreground">
              No images found
            </p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search or upload some new images.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(150px,100%),1fr))]">
          {images.map((image) => (
            <div key={image.id} className="group relative aspect-square overflow-hidden rounded-xl border bg-muted/10 transition-all hover:shadow-md hover:border-primary/20">
              <Image
                src={image.url}
                alt={image.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 flex flex-col justify-between bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="flex justify-end p-2 gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="size-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                        onClick={() => setSelectedImageForPreview(image)}
                      >
                        <IconEye className="size-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Preview</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="size-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                        onClick={() => copyUrlToClipboard(image.url, image.id)}
                      >
                        {copiedId === image.id ? (
                          <IconCheck className="size-4 text-green-400" />
                        ) : (
                          <IconCopy className="size-4" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Copy URL</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="size-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-destructive/80 transition-colors"
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
                    <TooltipContent side="bottom">Delete</TooltipContent>
                  </Tooltip>
                </div>

                <div className="p-2 bg-linear-to-t from-black/60 to-transparent">
                  <p className="truncate text-[10px] font-medium text-white">
                    {image.name}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Dialog */}
      <AlertDialog
        open={!!selectedImageForPreview}
        onOpenChange={(open) => {
          if (!open) setSelectedImageForPreview(null);
        }}
      >
        <AlertDialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-transparent shadow-none">
          {selectedImageForPreview && (
            <div className="relative flex flex-col md:flex-row h-full max-h-[90vh] bg-background rounded-2xl overflow-hidden shadow-2xl border">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedImageForPreview(null)}
                className="absolute right-4 top-4 z-10 size-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-muted transition-colors border shadow-sm"
              >
                <IconX className="size-4" />
              </button>

              {/* Image Section */}
              <div className="relative flex-1 bg-muted/30 min-h-75 md:min-h-125">
                <Image
                  src={selectedImageForPreview.url}
                  alt={selectedImageForPreview.name}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 100vw, 70vw"
                  priority
                />
              </div>

              {/* Info Section */}
              <div className="w-full md:w-80 p-6 flex flex-col bg-card border-l">
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight truncate mb-1" title={selectedImageForPreview.name}>
                      {selectedImageForPreview.name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-green-500" />
                      Uploaded on {new Date(selectedImageForPreview.uploadedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Image URL
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-9 rounded-lg border bg-muted/50 px-3 flex items-center overflow-hidden">
                        <p className="text-xs text-muted-foreground truncate">
                          {selectedImageForPreview.url}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="size-9 shrink-0"
                        onClick={() => copyUrlToClipboard(selectedImageForPreview.url, selectedImageForPreview.id)}
                      >
                        {copiedId === selectedImageForPreview.id ? (
                          <IconCheck className="size-4 text-green-500" />
                        ) : (
                          <IconCopy className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-xl border bg-muted/5 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Type</p>
                      <p className="text-sm font-medium">{selectedImageForPreview.name.split('.').pop()?.toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t space-y-3">
                  <Button
                    onClick={() => handleDeleteClick(selectedImageForPreview)}
                    disabled={isPending}
                    variant="destructive"
                    className="w-full gap-2 h-10 rounded-xl shadow-sm"
                  >
                    {isPending ? (
                      <IconLoader2 className="size-4 animate-spin" />
                    ) : (
                      <IconTrash className="size-4" />
                    )}
                    Delete Permanently
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-10 rounded-xl"
                    onClick={() => setSelectedImageForPreview(null)}
                  >
                    Close Preview
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
            <AlertDialogTitle>Delete Image?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {deleteConfirmation?.usage.isUsed ? (
                <div className="space-y-3 mt-2">
                  <p className="text-destructive font-semibold">
                    ⚠️ This image is being used in {deleteConfirmation.usage.usedInPosts.length} post(s):
                  </p>
                  <ul className="space-y-2">
                    {deleteConfirmation.usage.usedInPosts.map((post) => (
                      <li key={post.slug} className="text-sm text-muted-foreground pl-4 border-l-2 border-destructive">
                        <strong>{post.title}</strong> ({post.slug})
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-destructive mt-2">
                    Deleting this image will break these posts. Are you sure?
                  </p>
                </div>
              ) : (
                <p>Are you sure you want to delete &quot;{deleteConfirmation?.image.name}&quot;? This action cannot be undone.</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex gap-2 justify-end">
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
