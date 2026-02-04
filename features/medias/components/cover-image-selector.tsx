"use client";

import { IconEdit, IconPhotoPlus, IconTrash } from "@tabler/icons-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { MediaFile } from "../medias.types";
import { ImageInsertDialog } from "./image-insert-dialog";

interface CoverImageSelectorProps {
  selectedImageUrl: string;
  onSelectImage: (image: MediaFile) => void;
}

export function CoverImageSelector({
  selectedImageUrl,
  onSelectImage,
}: CoverImageSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleImageSelect = (image: MediaFile) => {
    onSelectImage(image);
    setIsDialogOpen(false);
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {selectedImageUrl ? (
          <div className="group relative aspect-square w-56 overflow-hidden rounded-2xl border bg-muted shadow-sm transition-all hover:shadow-md">
            <Image
              src={selectedImageUrl}
              alt="Cover image preview"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100 backdrop-blur-[2px]">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setIsDialogOpen(true)}
                className="h-9 gap-2 rounded-xl shadow-lg"
              >
                <IconEdit className="size-4" />
                Change
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() =>
                  onSelectImage({
                    id: "",
                    name: "",
                    path: "",
                    url: "",
                    uploadedAt: "",
                  })
                }
                className="h-9 gap-2 rounded-xl shadow-lg"
              >
                <IconTrash className="size-4" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="flex h-48 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 transition-all hover:border-primary/40 hover:bg-muted/30 group"
          >
            <div className="rounded-2xl bg-muted p-3 group-hover:bg-primary/10 transition-colors">
              <IconPhotoPlus className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                No cover image
              </p>
              <p className="text-xs text-muted-foreground">
                Click to select an image
              </p>
            </div>
          </button>
        )}
      </div>

      <ImageInsertDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSelect={handleImageSelect}
      />
    </TooltipProvider>
  );
}
