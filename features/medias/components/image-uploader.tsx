'use client'

import { useState, useRef, useCallback, useTransition } from 'react'
import { IconUpload, IconLoader2, IconX, IconCheck } from '@tabler/icons-react'
import { uploadImageAction } from '../medias.actions'
import type { UploadedImage } from "../medias.types"
import { Button } from '@/components/ui/button'

interface ImageFile {
  file: File
  preview: string
  progress: number
  error: string | null
  uploaded: boolean
}

interface ImageUploaderProps {
  onUploadSuccess?: (image: UploadedImage) => void
  maxSize?: number // in MB
}

export function ImageUploader({ onUploadSuccess, maxSize = 5 }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<ImageFile[]>([])
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        return 'Only image files are allowed'
      }
      if (file.size > maxSize * 1024 * 1024) {
        return `File size must be less than ${maxSize}MB`
      }
      return null
    },
    [maxSize]
  )

  const handleFiles = useCallback(
    (files: FileList) => {
      const fileArray = Array.from(files)
      const newFiles: ImageFile[] = fileArray.map((file) => {
        const error = validateFile(file)
        const preview = error ? '' : URL.createObjectURL(file)
        return {
          file,
          preview,
          progress: 0,
          error: error || null,
          uploaded: false,
        }
      })

      setUploadedFiles((prev) => [...prev, ...newFiles])
    },
    [validateFile]
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
      e.target.value = ''
    }
  }

  const handleUpload = (imageFile: ImageFile) => {
    startTransition(async () => {
      try {
        const uploadedImage = await uploadImageAction(imageFile.file)
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file === imageFile.file
              ? { ...f, progress: 100, uploaded: true }
              : f
          )
        )
        onUploadSuccess?.(uploadedImage)

        // Remove from list after 2 seconds
        setTimeout(() => {
          setUploadedFiles((prev) => prev.filter((f) => f.file !== imageFile.file))
        }, 2000)
      } catch {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file === imageFile.file
              ? { ...f, error: 'Failed to upload' }
              : f
          )
        )
      }
    })
  }

  const handleRetry = (imageFile: ImageFile) => {
    // Reset error state and progress
    setUploadedFiles((prev) =>
      prev.map((f) =>
        f.file === imageFile.file
          ? { ...f, error: null, progress: 0 }
          : f
      )
    )
    // Start upload
    handleUpload(imageFile)
  }

  const removeFile = (file: File) => {
    URL.revokeObjectURL(uploadedFiles.find(f => f.file === file)?.preview || '')
    setUploadedFiles((prev) => prev.filter((f) => f.file !== file))
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <button
        type="button"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-lg border-2 border-dashed transition-all cursor-pointer p-8 text-center ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          disabled={isPending}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          {isDragging ? (
            <>
              <div className="rounded-full bg-primary/10 p-3">
                <IconUpload className="h-6 w-6 text-primary animate-bounce" />
              </div>
              <div>
                <p className="font-medium text-foreground">Drop images here</p>
                <p className="text-sm text-muted-foreground">
                  Release to add to queue
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-full bg-muted p-3">
                <IconUpload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Drag & drop images here
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse (Max {maxSize}MB per file)
                </p>
              </div>
            </>
          )}
        </div>
      </button>

      {/* Image Preview and Upload */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          {uploadedFiles.map((item) => (
            <div
              key={item.file.name + item.file.lastModified}
              className="flex items-start gap-4 rounded-lg border bg-card p-4"
            >
              {/* Image Preview */}
              {item.preview && !item.error && (
                <div
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted"
                  style={{
                    backgroundImage: `url(${item.preview})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              )}

              {/* File Info and Progress */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {item.uploaded && (
                    <div className="shrink-0 rounded-full bg-green-100 p-1 dark:bg-green-900">
                      <IconCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                  )}
                </div>

                {item.error && (
                  <span className="text-xs text-destructive mt-2 block">
                    {item.error}
                  </span>
                )}

                {/* Progress Bar */}
                {(item.progress > 0 || isPending) && (
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full transition-all ${
                        item.error
                          ? 'bg-destructive'
                          : item.progress === 100
                            ? 'bg-green-600'
                            : 'bg-primary'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 shrink-0">
                {!item.uploaded && !item.error ? (
                  <Button
                    onClick={() => handleUpload(item)}
                    disabled={isPending}
                    size="sm"
                    className="gap-2"
                  >
                    {isPending ? (
                      <>
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                        Uploading
                      </>
                    ) : (
                      <>
                        <IconUpload className="h-4 w-4" />
                        Upload
                      </>
                    )}
                  </Button>
                ) : null}
                {item.error ? (
                  <Button
                    onClick={() => handleRetry(item)}
                    disabled={isPending}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {isPending ? (
                      <>
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                        Retrying
                      </>
                    ) : (
                      <>
                        <IconUpload className="h-4 w-4" />
                        Retry
                      </>
                    )}
                  </Button>
                ) : null}
                <Button
                  onClick={() => removeFile(item.file)}
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <IconX className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
