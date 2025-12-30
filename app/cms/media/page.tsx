"use client";

import { useEffect, useMemo, useState } from "react";
import { IconSearch, IconX } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageGallery } from "@/features/medias/components/image-gallery";
import { ImageUploader } from "@/features/medias/components/image-uploader";
import type { MediaFile } from "@/features/medias/medias.types";
import { listImagesAction } from "@/features/medias/medias.actions";
import PageLayout from "@/features/shared/components/page-layout";

export default function MediaPage() {
  const [images, setImages] = useState<MediaFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "jpg" | "png" | "gif" | "svg" | "webp">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true);
      try {
        const loadedImages = await listImagesAction();
        setImages(loadedImages);
      } catch (error) {
        console.error("Error loading images:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadImages();
  }, []);

  // Get all image types
  const imageTypes = useMemo(() => {
    const types = new Set<string>();
    images.forEach((img) => {
      const ext = img.name.split(".").pop()?.toLowerCase() || "unknown";
      if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
        types.add(ext === "jpeg" ? "jpg" : ext);
      }
    });
    return Array.from(types).sort();
  }, [images]);

  // Filter and search images
  const filteredImages = useMemo(() => {
    return images.filter((image) => {
      // Search filter by filename
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery || image.name.toLowerCase().includes(searchLower);

      // Type filter
      let matchesType = filterType === "all";
      if (filterType !== "all") {
        const ext = image.name.split(".").pop()?.toLowerCase() || "unknown";
        const normalizedExt = ext === "jpeg" ? "jpg" : ext;
        matchesType = normalizedExt === filterType;
      }

      return matchesSearch && matchesType;
    });
  }, [images, searchQuery, filterType]);

  const resetFilters = () => {
    setSearchQuery("");
    setFilterType("all");
  };

  const hasActiveFilters = searchQuery || filterType !== "all";

  return (
    <PageLayout
      title="Media Library"
      description="Upload and manage your images"
      breadcrumbs={[{ label: "Dashboard", href: "/cms" }, { label: "Media" }]}
    >
      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Upload Images</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Upload images to use in your posts. Supported formats: JPG, PNG,
            GIF, SVG, WebP
          </p>
          <ImageUploader onUploadComplete={() => {
            // Reload images after upload
            const loadImages = async () => {
              const loadedImages = await listImagesAction();
              setImages(loadedImages);
            };
            loadImages();
          }} />
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Your Images</h2>

          {/* Search and Filter */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search images by filename..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Type Filter Buttons */}
            {imageTypes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("all")}
                >
                  All Types
                </Button>
                {imageTypes.map((type) => (
                  <Button
                    key={type}
                    variant={
                      filterType === (type as "jpg" | "png" | "gif" | "svg" | "webp")
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setFilterType(type as "jpg" | "png" | "gif" | "svg" | "webp")
                    }
                  >
                    {type.toUpperCase()}
                  </Button>
                ))}
              </div>
            )}

            {/* Filter Status */}
            <div className="flex items-center justify-between">
              <Badge variant="secondary">
                {filteredImages.length} of {images.length} images
              </Badge>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="gap-2"
                >
                  <IconX className="size-4" />
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          <ImageGallery 
            images={filteredImages} 
            isLoading={isLoading}
            onImageDeleted={(imageId) => {
              setImages((prev) => prev.filter((img) => img.id !== imageId));
            }}
          />
        </div>
      </div>
    </PageLayout>
  );
}
