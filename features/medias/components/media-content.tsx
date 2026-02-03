import { Skeleton } from "@/components/ui/skeleton";
import { listImagesAction } from "../medias.actions";
import { MediaGallery } from "./media-gallery";
import MediaFilters from "./media-filters";
import MediaUploadSheet from "./media-upload-sheet";
import { IconFileText } from "@tabler/icons-react";


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

  const mediaStat = [
    {
      title: "Total Assets",
      value: images.length,
      description: "Total Assets",
      icon: IconFileText,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "File Types",
      value: imageTypes.length,
      description: "File Types",
      icon: IconFileText,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
        {mediaStat.map((stat) => (
          <div key={stat.title} className="rounded-xl border bg-card/50 p-4 backdrop-blur-sm">
            <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>
      

      <MediaUploadSheet />


      <MediaFilters imageTypes={imageTypes} />

      <div className="min-h-96">
        <MediaGallery media={images} search={search} filter={filter} />
      </div>
    </div>
  );
}


