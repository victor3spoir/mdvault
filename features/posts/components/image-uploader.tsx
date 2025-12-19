'use client'

import { useState, useRef, useCallback } from 'react'
import { IconUpload, IconLoader2, IconX } from '@tabler/icons-react'
import { uploadImageAction } from '../actions/images.actions'
import type { UploadedImage } from '../actions/images.actions'

interface ImageUploaderProps {
  onUploadSuccess?: (image: UploadedImage) => void
  maxSize?: number // in MB
}

export function ImageUploader({ onUploadSuccess, maxSize = 10 }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ file: File; progress: number; error?: string }>
  >([])
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
    async (files: FileList) => {
      const fileArray = Array.from(files)
      const validFiles = fileArray.filter((file) => {
        const error = validateFile(file)
        if (error) {
          setUploadedFiles((prev) => [
            ...prev,
            { file, progress: 0, error },
          ])
          return false
        }
        return true
      })

      setUploadedFiles((prev) => [
        ...prev,
        ...validFiles.map((f) => ({ file: f, progress: 0 })),
      ])

      setUploading(true)

      for (const file of validFiles) {
        try {
          const uploadedImage = await uploadImageAction(file)
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.file === file
                ? { ...f, progress: 100 }
                : f
            )
          )
          onUploadSuccess?.(uploadedImage)

          // Remove from list after 2 seconds
          setTimeout(() => {
            setUploadedFiles((prev) => prev.filter((f) => f.file !== file))
          }, 2000)
        } catch (error) {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.file === file
                ? { ...f, error: 'Failed to upload' }
                : f
            )
          )
        }
      }

      setUploading(false)
    },
    [validateFile, onUploadSuccess]
  )

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
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

  const removeFile = (file: File) => {
    setUploadedFiles((prev) => prev.filter((f) => f.file !== file))
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
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
          disabled={uploading}
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
                  Release to upload
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
      </div>

      {/* Upload Progress */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((item) => (
            <div
              key={item.file.name}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {item.file.name}
                  </p>
                  {item.error && (
                    <span className="text-xs text-destructive">
                      {item.error}
                    </span>
                  )}
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${
                      item.error
                        ? 'bg-destructive'
                        : item.progress === 100
                          ? 'bg-primary'
                          : 'bg-primary/60'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
              {item.progress === 100 || item.error ? (
                <button
                  onClick={() => removeFile(item.file)}
                  className="rounded p-1 hover:bg-muted"
                >
                  <IconX className="h-4 w-4 text-muted-foreground" />
                </button>
              ) : (
                <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
