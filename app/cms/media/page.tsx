"use client";

import {
  IconPhotoPlus,
  IconRefresh,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
        description="Upload and manage your images"
        breadcrumbs={[{ label: "Dashboard", href: "/cms" }, { label: "Media" }]}
      >
        <div className="space-y-8">
          {/* Header Actions */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">
                  Your Images
                </h2>
                <Badge
                  variant="secondary"
                  className="h-6 rounded-lg px-2 font-mono text-[10px] font-bold uppercase tracking-wider"
                >
                  {filteredImages.length} / {images.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage and organize your media assets
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={loadImages}
                    disabled={isLoading}
                    className="h-11 w-11 rounded-xl shadow-sm transition-all hover:bg-muted active:scale-95"
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
                    className="h-11 gap-2 rounded-xl px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95"
                  >
                    <IconPhotoPlus className="size-5" />
                    Upload New
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-xl">
                  <SheetHeader className="pb-8">
                    <SheetTitle className="text-2xl font-bold">
                      Upload Media
                    </SheetTitle>
                    <SheetDescription className="text-base">
                      Drag and drop images to upload them to your library.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 p-2">
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
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col gap-4 rounded-2xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-xl border-none bg-muted/50 pl-10 text-sm shadow-inner transition-all focus-visible:ring-primary/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <IconX className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={filterType === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterType("all")}
                className={cn(
                  "h-9 rounded-lg px-4 text-xs font-bold uppercase tracking-wider",
                  filterType === "all" &&
                    "bg-primary/10 text-primary hover:bg-primary/20",
                )}
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
                  className={cn(
                    "h-9 rounded-lg px-4 text-xs font-bold uppercase tracking-wider",
                    filterType === type &&
                      "bg-primary/10 text-primary hover:bg-primary/20",
                  )}
                >
                  {type}
                </Button>
              ))}

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-9 gap-2 rounded-lg px-3 text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <IconX className="size-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Gallery */}
          <div className="min-h-100">
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
