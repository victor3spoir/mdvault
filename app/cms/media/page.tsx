"use client";

import {
  IconPhotoPlus,
  IconRefresh,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ImageGallery } from "@/features/medias/components/image-gallery";
import { ImageUploader } from "@/features/medias/components/image-uploader";
import { listImagesAction } from "@/features/medias/medias.actions";
import type { MediaFile } from "@/features/medias/medias.types";
import PageLayout from "@/features/shared/components/page-layout";
import { cn } from "@/lib/utils";

export default function MediaPage() {
  const [images, setImages] = useState<MediaFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "jpg" | "png" | "gif" | "svg" | "webp"
  >("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const loadImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedImages = await listImagesAction();
      setImages(loadedImages);
    } catch (error) {
      console.error("Error loading images:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

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
    <TooltipProvider>
      <PageLayout
        title="Media Library"
        description="Manage your digital assets"
        breadcrumbs={[{ label: "Dashboard", href: "/cms" }, { label: "Media" }]}
      >
        <div className="space-y-6">
          {/* Header with Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-card/50 p-4 backdrop-blur-sm">
              <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{images.length}</p>
            </div>
            <div className="rounded-xl border bg-card/50 p-4 backdrop-blur-sm">
              <p className="text-sm font-medium text-muted-foreground">Currently Viewing</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{filteredImages.length}</p>
            </div>
            <div className="rounded-xl border bg-card/50 p-4 backdrop-blur-sm">
              <p className="text-sm font-medium text-muted-foreground">File Types</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{imageTypes.length}</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-card/50 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={loadImages}
                    disabled={isLoading}
                    className="h-10 w-10 rounded-lg"
                  >
                    <IconRefresh
                      className={cn("size-5", isLoading && "animate-spin")}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh library</TooltipContent>
              </Tooltip>

              <Sheet open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    className="h-10 gap-2 rounded-lg px-4 font-semibold"
                  >
                    <IconPhotoPlus className="size-4" />
                    Upload Asset
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-xl">
                  <SheetHeader className="pb-8">
                    <SheetTitle className="text-xl font-bold">
                      Upload Asset
                    </SheetTitle>
                    <SheetDescription>
                      Add new images to your media library
                    </SheetDescription>
                  </SheetHeader>
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/5 p-2">
                    <ImageUploader
                      onUploadSuccess={() => {
                        loadImages();
                        setIsUploadOpen(false);
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="gap-2"
              >
                <IconX className="size-3.5" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="space-y-3 rounded-xl border bg-card/50 p-4 backdrop-blur-sm">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search assets by filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-lg border-none bg-muted/50 pl-9 text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                >
                  <IconX className="size-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filter:</span>
              <Button
                type="button"
                variant={filterType === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterType("all")}
                className="h-8 rounded-lg px-3 text-xs"
              >
                All
              </Button>
              {imageTypes.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={filterType === type ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilterType(type as typeof filterType)}
                  className="h-8 rounded-lg px-3 text-xs uppercase"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Gallery */}
          <div className="min-h-96">
            <ImageGallery
              images={filteredImages}
              isLoading={isLoading}
              onRefresh={loadImages}
            />
          </div>
        </div>
      </PageLayout>
    </TooltipProvider>
  );
}
