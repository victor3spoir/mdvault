"use client";

import { IconCheck, IconCopy, IconEye, IconX, IconTrash, IconLoader2 } from "@tabler/icons-react";
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
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
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
    <>
      {images.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 py-12 text-center">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              No images uploaded yet.
            </p>
            <p className="text-xs text-muted-foreground/75">
              Use the uploader above to add images to your store.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
          {images.map((image) => (
            <div key={image.id} className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedImageForPreview(image);
                }}
                className={`group relative w-full overflow-hidden rounded-lg border-2 transition-all aspect-square border-muted hover:border-muted-foreground/50`}
              >
                <div className="relative w-full h-full bg-muted">
                  <Image
                    src={image.url}
                    alt={image.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    className="h-8 w-8 rounded bg-white/20 p-1.5 text-white hover:bg-white/30 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageForPreview(image);
                    }}
                    title="Preview"
                  >
                    <IconEye />
                  </button>
                  <button
                    type="button"
                    className="h-8 w-8 rounded bg-white/20 p-1.5 text-white hover:bg-white/30 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyUrlToClipboard(image.url, image.id);
                    }}
                    title="Copy URL"
                  >
                    {copiedId === image.id ? (
                      <IconCheck className="h-full w-full" />
                    ) : (
                      <IconCopy className="h-full w-full" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="h-8 w-8 rounded bg-white/20 p-1.5 text-white hover:bg-destructive/80 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(image);
                    }}
                    title="Delete"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <IconLoader2 className="h-full w-full animate-spin" />
                    ) : (
                      <IconTrash className="h-full w-full" />
                    )}
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/20 to-transparent px-1 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate">{image.name}</p>
                </div>
              </button>
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
        <AlertDialogContent className="max-w-3xl">
          {selectedImageForPreview && (
            <div className="space-y-4">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedImageForPreview(null)}
                className="absolute right-4 top-4 rounded-lg p-1 hover:bg-muted"
              >
                <IconX className="h-5 w-5" />
              </button>

              <AlertDialogHeader>
                <AlertDialogTitle>Image Preview</AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedImageForPreview.name}
                </AlertDialogDescription>
              </AlertDialogHeader>

              {/* Image Preview */}
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <Image
                  src={selectedImageForPreview.url}
                  alt={selectedImageForPreview.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 90vw"
                  priority
                />
              </div>

              {/* Image Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {selectedImageForPreview.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Uploaded:{" "}
                    {new Date(
                      selectedImageForPreview.uploadedAt,
                    ).toLocaleDateString()}
                  </p>
                </div>

                {/* URL Copy */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedImageForPreview.url}
                    readOnly
                    className="flex-1 rounded border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      copyUrlToClipboard(
                        selectedImageForPreview.url,
                        selectedImageForPreview.id,
                      )
                    }
                    className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition flex items-center gap-2"
                  >
                    {copiedId === selectedImageForPreview.id ? (
                      <>
                        <IconCheck className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <IconCopy className="h-4 w-4" />
                        Copy URL
                      </>
                    )}
                  </button>
                </div>

                {/* Delete Button */}
                <Button
                  onClick={() => handleDeleteClick(selectedImageForPreview)}
                  disabled={isPending}
                  variant="destructive"
                  className="w-full gap-2"
                >
                  {isPending ? (
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <IconTrash className="h-4 w-4" />
                  )}
                  Delete Image
                </Button>
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
            <AlertDialogDescription>
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
                `Are you sure you want to delete "${deleteConfirmation?.image.name}"? This action cannot be undone.`
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
                  <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
