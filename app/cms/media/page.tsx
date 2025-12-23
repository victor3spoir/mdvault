import { ImageGallery } from "@/features/medias/components/image-gallery";
import { ImageUploader } from "@/features/medias/components/image-uploader";
import { listImagesAction } from "@/features/medias/medias.actions";
import PageLayout from "@/features/shared/components/page-layout";

export default async function MediaPage() {
  const loadedImages = await listImagesAction();

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
          <ImageUploader />
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Your Images</h2>
          <ImageGallery images={loadedImages} />
        </div>
      </div>
    </PageLayout>
  );
}
