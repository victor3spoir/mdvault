"use client";

import { IconPhoto, IconUpload } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { MediaFile  } from "../medias.types";
import { ImageSelector } from "./image-selector";
import { ImageUploader } from "./image-uploader";

interface ImageInsertDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (image: MediaFile ) => void;
}

export function ImageInsertDialog({
  open,
  onClose,
  onSelect,
}: ImageInsertDialogProps) {
  const [selectedImage, setSelectedImage] = useState<MediaFile  | null>(
    null,
  );

  const handleSelect = (image: MediaFile ) => {
    setSelectedImage(image);
  };

  const handleInsert = () => {
    if (selectedImage) {
      onSelect(selectedImage);
      setSelectedImage(null);
      onClose();
    }
  };



  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b p-6">
          <SheetTitle className="text-2xl font-bold tracking-tight">
            Insert Image
          </SheetTitle>
          <SheetDescription className="text-base">
            Upload a new image or select from your library
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {/* Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <IconUpload className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Upload New
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Drag & drop or click to select
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 p-2 transition-colors hover:bg-muted/10">
                <ImageUploader />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or select from library
                </span>
              </div>
            </div>

            {/* Gallery Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-foreground/70">
                  <IconPhoto className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Your Library
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Choose an image to insert
                  </p>
                </div>
              </div>
              <div className="min-h-60">
                <ImageSelector
                  selectedImageUrl={selectedImage?.url ?? ""}
                  onSelectImage={handleSelect}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t bg-muted/30 p-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-11 rounded-xl px-6 font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleInsert}
            disabled={!selectedImage}
            className="h-11 rounded-xl px-8 font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95 disabled:opacity-50"
          >
            Insert Image
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
