"use client";

import {
  IconPhotoOff,
} from "@tabler/icons-react";
import { useMemo } from "react";
import { useQueryState } from "nuqs";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { MediaFile  } from "../medias.types";
import MediaCard from "./media-card";



interface ImageGalleryProps {
  images: MediaFile [];
}

export function ImageGallery({ images }: ImageGalleryProps) {




  const [search] = useQueryState("search", {
    defaultValue: "",
    parse: String,
  });

  const [filter] = useQueryState("filter", {
    defaultValue: "all",
    parse: String,
  });



  const filteredImages = useMemo(() => {
    return images.filter((image) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search || image.name.toLowerCase().includes(searchLower);

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
        className="gap-4 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))]"
      >
        {filteredImages.map((image) => (
          <MediaCard media={image} key={image.id} />
        ))}
      </div>

    </TooltipProvider>
  );
}
