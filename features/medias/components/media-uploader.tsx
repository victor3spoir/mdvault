"use client";

import { toast } from "sonner";
import { ImageUploader } from "@/features/medias/components/image-uploader";

interface MediaUploaderProps {
  onUploadSuccess?: () => void;
}

export function MediaUploader() {
  return (
    <ImageUploader />
  );
}
