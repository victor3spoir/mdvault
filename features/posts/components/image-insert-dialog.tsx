'use client'

import { useState } from 'react'
import { ImageSelector } from './image-selector'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Insert Image</SheetTitle>
          <SheetDescription>
            Select an image from your store or upload a new one
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <ImageSelector
            selectedImageUrl={selectedImage?.url ?? ''}
            onSelectImage={handleSelect}
            showUpload={true}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleInsert} disabled={!selectedImage}>
              Insert Image
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
