"use client";

import { ImageUploader } from "@/features/medias/components/image-uploader";

interface MediaUploaderProps {
  onUploadSuccess?: () => void;
}

export function MediaUploader() {
  return <ImageUploader />;
}
