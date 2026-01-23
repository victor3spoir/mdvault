"use client";

import {
  IconEye,
  IconPhotoOff,
  IconTrash,
} from "@tabler/icons-react";
import dynamic from "next/dynamic";
import { useMemo, useState, useTransition } from "react";
import { useQueryState } from "nuqs";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { checkMediaUsageAction } from "../medias.actions";
import type { MediaUsage, UploadedImage } from "../medias.types";
import { ImagePreviewDialog } from "./image-preview-dialog";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

const Image = dynamic(() => import("next/image"), { ssr: false });

interface ImageGalleryProps {
  images: UploadedImage[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImageForPreview, setSelectedImageForPreview] =
    useState<UploadedImage | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    image: UploadedImage;
    usage: MediaUsage;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [search] = useQueryState("search", {
    defaultValue: "",
    parse: String,
  });

  const [filter] = useQueryState("filter", {
    defaultValue: "all",
    parse: String,
  });

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

  // Filter images based on query params
  const filteredImages = useMemo(() => {
    return images.filter((image) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search || image.name.toLowerCase().includes(searchLower);

      // Type filter
      let matchesType = filter === "all";
      if (filter !== "all") {
        const ext = image.name.split(".").pop()?.toLowerCase() || "unknown";
        const normalizedExt = ext === "jpeg" ? "jpg" : ext;
        matchesType = normalizedExt === filter;
      }

      return matchesSearch && matchesType;
    });
  }, [images, search, filter]);

  if (filteredImages.length === 0) {
    return (
      <TooltipProvider>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-24 text-center">
          <div className="rounded-lg bg-muted/20 p-3 mb-3">
            <IconPhotoOff className="size-8 text-muted-foreground/60" />
          </div>
          <div className="max-w-sm space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {images.length === 0 ? "No media found" : "No results"}
            </p>
            <p className="text-xs text-muted-foreground">
              {images.length === 0
                ? "Upload your first asset to get started"
                : "Try adjusting your search or filters"}
            </p>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div
        className="gap-4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1rem",
        }}
      >
        {filteredImages.map((image) => (
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
                      className="size-9 rounded-lg bg-destructive/80 backdrop-blur flex items-center justify-center text-white hover:bg-destructive transition-colors"
                      onClick={() => handleDeleteClick(image)}
                      disabled={isPending}
                    >
                      <IconTrash className="size-4" />
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

      {/* Dialogs */}
      <ImagePreviewDialog
        image={selectedImageForPreview}
        onOpenChange={(open) => {
          if (!open) setSelectedImageForPreview(null);
        }}
        onDelete={handleDeleteClick}
      />

      <DeleteConfirmationDialog
        image={deleteConfirmation?.image || null}
        usage={deleteConfirmation?.usage || null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmation(null);
        }}
        onDeleteSuccess={() => {
          setSelectedImageForPreview(null);
        }}
      />
    </TooltipProvider>
  );
}
