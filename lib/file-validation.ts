import { fileTypeFromBuffer } from 'file-type'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export interface ValidatedImageFile {
  buffer: Buffer
  format: string
  size: number
  mimeType: string
}

/**
 * Validate image file:
 * 1. Check MIME type
 * 2. Verify magic bytes (true file type)
 * 3. Validate file size
 */
export async function validateImageFile(file: File): Promise<ValidatedImageFile> {
  // 1. Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`)
  }

  // 2. Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`)
  }

  // 3. Read file buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // 4. Verify actual file type using magic bytes (prevents file spoofing)
  try {
    const detectedType = await fileTypeFromBuffer(buffer)
    if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
      throw new Error('File does not appear to be a valid image. Please check the file.')
    }

    return {
      buffer,
      format: detectedType.ext || 'png',
      size: buffer.length,
      mimeType: detectedType.mime,
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('valid image')) {
      throw error
    }
    throw new Error('Invalid or corrupted image file')
  }
}
