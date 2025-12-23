"use client";

import { IconCheck, IconCopy, IconEye, IconX } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { UploadedImage } from "../medias.types";

const Image = dynamic(() => import("next/image"), { ssr: false });

interface ImageGalleryProps {
  images: UploadedImage[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedImageForPreview, setSelectedImageForPreview] =
    useState<UploadedImage | null>(null);

  const copyUrlToClipboard = useCallback((url: string, imageId: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(imageId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

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
        <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
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
              <div className="space-y-2">
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
              </div>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
