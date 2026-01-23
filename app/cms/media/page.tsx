import { Suspense } from "react";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import PageLayout from "@/features/shared/components/page-layout";
import MediaContent, { MediaSkeleton } from "@/features/medias/components/media-content";

export const metadata = {
  title: "Media Library - MDVault",
};


export default function Page() {
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
