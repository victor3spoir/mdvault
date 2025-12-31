"use client";

import { IconPhoto, IconSearch, IconCheck } from "@tabler/icons-react";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { listImagesAction } from "../medias.actions";
import type { UploadedImage } from "../medias.types";

interface ImageSelectorProps {
  selectedImageUrl?: string;
  onSelectImage: (image: UploadedImage) => void;
}

export function ImageSelector({
  selectedImageUrl = "",
  onSelectImage,
}: ImageSelectorProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadImages = async () => {
      try {
        const imageList = await listImagesAction();
        setImages(imageList);
      } catch (error) {
        console.error("Failed to load images:", error);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, []);

  const filteredImages = useMemo(() => {
    return images.filter((image) =>
      image.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [images, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(150px,100%),1fr))]">
          {["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"].map((id) => (
            <Skeleton key={id} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 py-16 text-center">
        <div className="mb-4 rounded-2xl bg-muted p-4">
          <IconPhoto className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            No images found
          </p>
          <p className="text-xs text-muted-foreground">
            Upload an image to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search images..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 rounded-xl pl-10 text-sm shadow-sm transition-all focus-visible:ring-primary/20"
        />
      </div>

      {filteredImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No images match your search
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(150px,100%),1fr))]">
          {filteredImages.map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => onSelectImage(image)}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-2xl border-2 transition-all duration-300",
                selectedImageUrl === image.url
                  ? "border-primary ring-4 ring-primary/10 shadow-lg"
                  : "border-transparent bg-muted/50 hover:border-primary/40 hover:shadow-md",
              )}
            >
              <Image
                src={image.url}
                alt={image.name}
                fill
                className={cn(
                  "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110",
                  selectedImageUrl === image.url && "scale-105",
                )}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {/* Selection Overlay */}
              <div
                className={cn(
                  "absolute inset-0 transition-all duration-300",
                  selectedImageUrl === image.url
                    ? "bg-primary/20"
                    : "bg-black/0 group-hover:bg-black/5",
                )}
              />

              {/* Checkmark */}
              {selectedImageUrl === image.url && (
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg animate-in zoom-in duration-200">
                  <IconCheck className="h-4 w-4" />
                </div>
              )}

              {/* Name on hover */}
              <div className="absolute inset-x-0 bottom-0 translate-y-full bg-linear-to-t from-black/80 to-transparent p-2 transition-transform duration-300 group-hover:translate-y-0">
                <p className="truncate text-[10px] font-medium text-white">
                  {image.name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
