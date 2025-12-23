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
import type { UploadedImage } from "../medias.types";
import { ImageSelector } from "./image-selector";
import { ImageUploader } from "./image-uploader";

interface ImageInsertDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (image: UploadedImage) => void;
}

export function ImageInsertDialog({
  open,
  onClose,
  onSelect,
}: ImageInsertDialogProps) {
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(
    null,
  );

  const handleSelect = (image: UploadedImage) => {
    setSelectedImage(image);
  };

  const handleInsert = () => {
    if (selectedImage) {
      onSelect(selectedImage);
      setSelectedImage(null);
      onClose();
    }
  };

  const handleUploadSuccess = (image: UploadedImage) => {
    setSelectedImage(image);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-2xl flex flex-col"
      >
        <SheetHeader className="pb-6">
          <SheetTitle className="text-2xl">Insert Image</SheetTitle>
          <SheetDescription>
            Upload a new image or select from your library
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-8 overflow-y-auto pr-4">
          {/* Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-primary/10 p-2">
                <IconUpload className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Upload New Image</h3>
                <p className="text-xs text-muted-foreground">
                  Drag & drop or click to select
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-muted bg-muted/30 p-4">
              <ImageUploader onUploadSuccess={handleUploadSuccess} />
            </div>
          </div>

          {/* Divider */}
          <Separator className="my-6" />

          {/* Gallery Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-secondary/50 p-2">
                <IconPhoto className="h-4 w-4 text-foreground/70" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Select from Library</h3>
                <p className="text-xs text-muted-foreground">
                  Choose an image to insert
                </p>
              </div>
            </div>
            <div>
              <ImageSelector
                selectedImageUrl={selectedImage?.url ?? ""}
                onSelectImage={handleSelect}
              />
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="mt-8 flex justify-end gap-3 border-t border-muted bg-muted/30 -mx-6 px-6 py-4">
          <Button variant="outline" onClick={onClose} className="px-6">
            Cancel
          </Button>
          <Button
            onClick={handleInsert}
            disabled={!selectedImage}
            className="px-6"
          >
            {selectedImage ? "Insert Image" : "Select an Image"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
