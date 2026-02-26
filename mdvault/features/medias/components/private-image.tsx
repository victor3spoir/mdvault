"use client";

import { cn } from "@/lib/utils";
import { useMediaCache } from "../hooks/use-media-cache";

interface PrivateImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Resolves a repo-relative path (e.g. "media/abc.jpg") to a Blob URL
 * using the hybrid media cache (bulk server fetch → base64 → Blob → Blob URL).
 * Also handles legacy https:// URLs directly.
 */
export function PrivateImage({ src, alt, fill, className }: PrivateImageProps) {
  const { resolve, isLoading } = useMediaCache();
  const blobUrl = resolve(src);

  const fillStyles: React.CSSProperties = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
    : {};

  if (isLoading || !blobUrl) {
    return (
      <div
        className={cn("animate-pulse bg-muted", className)}
        style={fillStyles}
        aria-hidden
      />
    );
  }

  return (
    // biome-ignore lint/performance/noImgElement: Blob URL — next/image only accepts remote URLs with configured hostname patterns
    <img
      src={blobUrl}
      alt={alt}
      className={className}
      style={fillStyles}
      draggable={false}
    />
  );
}
