'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { listImagesAction } from '../actions/images.actions'
import type { UploadedImage } from '../actions/images.actions'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { IconPhoto } from '@tabler/icons-react'

interface ImageSelectorProps {
  selectedImageUrl?: string
  onSelectImage: (image: UploadedImage) => void
}

export function ImageSelector({
  selectedImageUrl = '',
  onSelectImage,
}: ImageSelectorProps) {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadImages = async () => {
      try {
        const imageList = await listImagesAction()
        setImages(imageList)
      } catch (error) {
        console.error('Failed to load images:', error)
      } finally {
        setLoading(false)
      }
    }

    loadImages()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        <Skeleton className="aspect-square rounded-lg" />
        <Skeleton className="aspect-square rounded-lg" />
        <Skeleton className="aspect-square rounded-lg" />
        <Skeleton className="aspect-square rounded-lg" />
        <Skeleton className="aspect-square rounded-lg" />
        <Skeleton className="aspect-square rounded-lg" />
        <Skeleton className="aspect-square rounded-lg" />
        <Skeleton className="aspect-square rounded-lg" />
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50 py-12">
        <IconPhoto className="mb-3 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No images uploaded yet</p>
        <p className="text-xs text-muted-foreground/70">Upload an image to get started</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {images.map((image) => (
        <button
          key={image.id}
          type="button"
          onClick={() => onSelectImage(image)}
          className={cn(
            'group relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200',
            selectedImageUrl === image.url
              ? 'border-primary ring-2 ring-primary ring-offset-2 shadow-md'
              : 'border-muted hover:border-primary/50 hover:shadow-sm'
          )}
        >
          <Image
            src={image.url}
            alt={image.name}
            fill
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          
          {/* Subtle overlay on hover */}
          <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/5" />
          
          {/* Checkmark for selected */}
          {selectedImageUrl === image.url && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/90">
              <div className="rounded-full bg-white p-1.5 shadow-lg">
                <svg
                  className="h-4 w-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="Selected image"
                >
                  <title>Selected image</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
