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
 * Resolves a repo-relative path (e.g. "media/abc.jpg") to a base64 data URL
 * using the hybrid media cache (bulk server fetch + client-side Map).
 * Also handles legacy https:// and data: URLs directly.
 */
export function PrivateImage({ src, alt, fill, className }: PrivateImageProps) {
  const { resolve, isLoading } = useMediaCache();
  const dataUrl = resolve(src);

  const fillStyles: React.CSSProperties = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
    : {};

  if (isLoading || !dataUrl) {
    return (
      <div
        className={cn("animate-pulse bg-muted", className)}
        style={fillStyles}
        aria-hidden
      />
    );
  }

  return (
    // biome-ignore lint/performance/noImgElement: data URL — next/image requires a remotely-hosted URL
    <img
      src={dataUrl}
      alt={alt}
      className={className}
      style={fillStyles}
      draggable={false}
    />
  );
}
