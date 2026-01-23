import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { IconPhotoPlus } from "@tabler/icons-react";
import { listImagesAction } from "../medias.actions";
import { MediaGallery } from "./media-gallery";
import MediaFilters from "./media-filters";
import MediaStats from "./media-stats";
import { MediaUploader } from "./media-uploader";
import { Button } from "@/components/ui/button";


export function MediaSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card/50 p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16 mt-3" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card/50 p-4">
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="rounded-xl border bg-card/50 p-4 space-y-3">
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => `skeleton-${i}`).map((key) => (
          <Skeleton key={key} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
}


export default async function MediaContent({
  search = "",
  filter = "all",
}: {
  search?: string;
  filter?: string;
}) {
  const result = await listImagesAction();

  if (!result.success) {
    return <div className="text-red-500">Error: {result.error}</div>;
  }

  const images = result.data;

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
      <MediaStats
        totalAssets={images.length}
        fileTypes={imageTypes.length}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-card/50 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
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
                <MediaUploader />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <MediaFilters imageTypes={imageTypes} />

      <div className="min-h-96">
        <MediaGallery media={images} search={search} filter={filter} />
      </div>
    </div>
  );
}


