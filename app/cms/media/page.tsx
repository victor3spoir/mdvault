import { Suspense } from "react";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import PageLayout from "@/features/shared/components/page-layout";
import MediaContent, { MediaSkeleton } from "@/features/medias/components/media-content";
import { loadMediaFilteringParams } from "@/features/medias/medias.types";

export const metadata = {
  title: "Media Library - MDVault",
};

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function Page({ searchParams }: PageProps) {
  const { search, filter } = await loadMediaFilteringParams(searchParams);

  return (
    <TooltipProvider>
      <PageLayout
        title="Media Library"
        description="Manage your digital assets"
        breadcrumbs={[{ label: "Dashboard", href: "/cms" }, { label: "Media" }]}
      >
        <Suspense fallback={<MediaSkeleton />}>
          <MediaContent search={search} filter={filter} />
        </Suspense>
      </PageLayout>
    </TooltipProvider>
  );
}
