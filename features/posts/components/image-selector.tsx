'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  IconLoader2,
  IconUpload,
  IconCopy,
  IconCheck,
} from '@tabler/icons-react'
import { listImagesAction, uploadImageAction } from '../actions/images.actions'

const Image = dynamic(() => import('next/image'), { ssr: false })

export interface UploadedImage {
  id: string
  name: string
  path: string
  url: string
  uploadedAt: string
}

interface ImageSelectorProps {
  onSelectImage?: (image: UploadedImage) => void
  selectedImageUrl?: string
  showUpload?: boolean
}

export function ImageSelector({
  onSelectImage,
  selectedImageUrl = '',
  showUpload = true,
}: ImageSelectorProps) {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadImages = useCallback(async () => {
    try {
      setLoading(true)
      const loadedImages = await listImagesAction()
      setImages(loadedImages)
    } catch (error) {
      console.error('Failed to load images:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load images on mount
  useEffect(() => {
    void loadImages()
  }, [loadImages])

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.currentTarget.files?.[0]
      if (!file) return

      try {
        setUploading(true)
        const uploadedImage = await uploadImageAction(file)
        setImages((prev) => [uploadedImage, ...prev])
        if (onSelectImage) {
          onSelectImage(uploadedImage)
        }
        // Reset input
        e.currentTarget.value = ''
      } catch (error) {
        console.error('Failed to upload image:', error)
      } finally {
        setUploading(false)
      }
    },
    [onSelectImage]
  )

  const copyUrlToClipboard = useCallback(
    (url: string, imageId: string) => {
      navigator.clipboard.writeText(url)
      setCopiedId(imageId)
      setTimeout(() => setCopiedId(null), 2000)
    },
    []
  )

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <IconLoader2 className='h-6 w-6 animate-spin text-muted-foreground' />
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {showUpload && (
        <div className='flex items-center gap-2'>
          <label htmlFor='image-upload' className='cursor-pointer'>
            <div className='flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/50 px-4 py-2 hover:border-muted-foreground'>
              <IconUpload className='h-4 w-4' />
              <span className='text-sm font-medium'>
                {uploading ? 'Uploading...' : 'Upload Image'}
              </span>
            </div>
            <input
              id='image-upload'
              type='file'
              accept='image/*'
              disabled={uploading}
              onChange={handleImageUpload}
              className='hidden'
            />
          </label>
        </div>
      )}

      {images.length === 0 ? (
        <div className='rounded-lg border border-dashed border-muted-foreground/30 py-12 text-center'>
          <div className='space-y-2'>
            <IconUpload className='mx-auto h-8 w-8 text-muted-foreground/50' />
            <p className='text-sm text-muted-foreground'>
              No images uploaded yet.
            </p>
            {showUpload && (
              <p className='text-xs text-muted-foreground/75'>
                Upload your first image to get started.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'>
          {images.map((image) => (
            <button
              key={image.id}
              type='button'
              onClick={() => onSelectImage?.(image)}
              className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                selectedImageUrl === image.url
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
            >
              <div className='relative aspect-square bg-muted'>
                <Image
                  src={image.url}
                  alt={image.name}
                  fill
                  className='object-cover'
                  sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                />
              </div>
              <div className='absolute inset-0 flex items-end gap-1 bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100'>
                <button
                  type='button'
                  className='h-6 w-6 rounded p-0 text-white hover:bg-white/20'
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault()
                    copyUrlToClipboard(image.url, image.id)
                  }}
                >
                  {copiedId === image.id ? (
                    <IconCheck className='h-3 w-3' />
                  ) : (
                    <IconCopy className='h-3 w-3' />
                  )}
                </button>
              </div>
              <div className='absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/20 to-transparent px-1 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100'>
                <p className='truncate'>{image.name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
