'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ImageInsertDialog } from './image-insert-dialog'
import { IconEdit, IconTrash } from '@tabler/icons-react'
import type { UploadedImage } from '../images/images.actions'

interface CoverImageSelectorProps {
  selectedImageUrl: string
  onSelectImage: (image: UploadedImage) => void
}

export function CoverImageSelector({
  selectedImageUrl,
  onSelectImage,
}: CoverImageSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleImageSelect = (image: UploadedImage) => {
    onSelectImage(image)
    setIsDialogOpen(false)
  }

  return (
    <>
      <div className="space-y-3">
        {selectedImageUrl ? (
          <div className="relative h-40 w-full overflow-hidden rounded-lg border border-border bg-muted">
            <Image
              src={selectedImageUrl}
              alt="Cover image preview"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setIsDialogOpen(true)}
                className="gap-2"
              >
                <IconEdit className="h-4 w-4" />
                Change
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => onSelectImage({ id: '', name: '', path: '', url: '', uploadedAt: '' })}
                className="gap-2"
              >
                <IconTrash className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex h-40 w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No cover image selected</p>
            </div>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setIsDialogOpen(true)}
        >
          {selectedImageUrl ? 'Change Cover Image' : 'Select Cover Image'}
        </Button>
      </div>

      <ImageInsertDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSelect={handleImageSelect}
      />
    </>
  )
}
