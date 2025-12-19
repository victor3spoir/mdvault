import { ImageUploader } from '@/features/posts/components/image-uploader'
import { ImageGallery } from '@/features/posts/components/image-gallery'
import PageLayout from '@/features/shared/components/page-layout'

export default function MediaPage() {
  return (
    <PageLayout
      title="Media Library"
      description="Upload and manage your images"
      breadcrumbs={[
        { label: 'Dashboard', href: '/cms' },
        { label: 'Media' },
      ]}
    >
      <div className="space-y-6">
        {/* Upload Section */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Upload Images</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Upload images to use in your posts. Supported formats: JPG, PNG, GIF, SVG, WebP
          </p>
          <ImageUploader />
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Your Images</h2>
          <ImageGallery />
        </div>
      </div>
    </PageLayout>
  )
}
