import {
  IconPhotoPlus,
} from "@tabler/icons-react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
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
import PageLayout from "@/features/shared/components/page-layout";
import MediaFilters from "./media-filters";
import MediaStats from "./media-stats";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Media Library - MDVault",
};

async function MediaContent() {
  const images = await listImagesAction();

  // Get all image types
  const imageTypes = Array.from(
    new Set(
      images.map((img) => {
        const ext = img.name.split(".").pop()?.toLowerCase() || "unknown";
        return ext === "jpeg" ? "jpg" : ext;
      }),
    ),
  ).sort();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <MediaStats
        totalAssets={images.length}
        fileTypes={imageTypes.length}
      />

      {/* Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-card/50 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-lg"
                disabled
                aria-label="auto-sync"
              >
                <svg
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Media auto-syncs</TooltipContent>
          </Tooltip>

          <Sheet>
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
                <ImageUploader onUploadSuccess={() => {}} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search and Filters */}
      <MediaFilters imageTypes={imageTypes} />

      {/* Gallery */}
      <div className="min-h-96">
        <ImageGallery images={images} />
      </div>
    </div>
  );
}

function MediaSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card/50 p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16 mt-3" />
          </div>
        ))}
      </div>

      {/* Action bar skeleton */}
      <div className="rounded-xl border bg-card/50 p-4">
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filters skeleton */}
      <div className="rounded-xl border bg-card/50 p-4 space-y-3">
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
      </div>

      {/* Gallery skeleton */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => `skeleton-${i}`).map((key) => (
          <Skeleton key={key} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function MediaPage() {
  return (
    <TooltipProvider>
      <PageLayout
        title="Media Library"
        description="Manage your digital assets"
        breadcrumbs={[{ label: "Dashboard", href: "/cms" }, { label: "Media" }]}
      >
        <Suspense fallback={<MediaSkeleton />}>
          <MediaContent />
        </Suspense>
      </PageLayout>
    </TooltipProvider>
  );
}
