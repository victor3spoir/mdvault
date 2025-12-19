'use client'

import { useState } from 'react'
import { ImageUploader } from './image-uploader'
import { ImageGallery } from './image-gallery'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { IconUpload, IconPhoto } from '@tabler/icons-react'
import type { UploadedImage } from '../actions/images.actions'

interface ImageInsertDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (image: UploadedImage) => void
}

export function ImageInsertDialog({
  open,
  onClose,
  onSelect,
}: ImageInsertDialogProps) {
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null)

  const handleSelect = (image: UploadedImage) => {
    setSelectedImage(image)
  }

  const handleInsert = () => {
    if (selectedImage) {
      onSelect(selectedImage)
      setSelectedImage(null)
      onClose()
    }
  }

  const handleUploadSuccess = (image: UploadedImage) => {
    setSelectedImage(image)
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl flex flex-col">
        <SheetHeader>
          <SheetTitle>Insert Image</SheetTitle>
          <SheetDescription>
            Upload a new image or select one from your store
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex-1 space-y-6 overflow-y-auto">
          {/* Upload Section */}
          <div>
            <h3 className="mb-3 font-semibold text-sm text-foreground flex items-center gap-2">
              <IconUpload className="h-4 w-4" />
              Upload Image
            </h3>
            <ImageUploader onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or select existing</span>
            </div>
          </div>

          {/* Gallery Section */}
          <div>
            <h3 className="mb-3 font-semibold text-sm text-foreground flex items-center gap-2">
              <IconPhoto className="h-4 w-4" />
              Your Images
            </h3>
            <ImageGallery
              selectedImageUrl={selectedImage?.url ?? ''}
              onSelectImage={handleSelect}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!selectedImage}>
            Insert Image
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
