"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getMediaDataUrlAction } from "../medias.actions";

interface PrivateImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Request queue to limit concurrent server action calls.
 * Without this, 28+ simultaneous requests to GitHub API cause timeouts.
 */
class MediaRequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private active = 0;
  private maxConcurrent = 3; // Limit to 3 concurrent requests

  async enqueue(fn: () => Promise<void>) {
    this.queue.push(fn);
    await this.process();
  }

  private async process() {
    while (this.active < this.maxConcurrent && this.queue.length > 0) {
      this.active++;
      const fn = this.queue.shift();
      if (fn) {
        try {
          await fn();
        } finally {
          this.active--;
          await this.process();
        }
      }
    }
  }
}

const requestQueue = new MediaRequestQueue();

/**
 * Converts a base64 data URL like `data:image/png;base64,...` into a Blob URL.
 */
function dataUrlToBlobUrl(dataUrl: string): string {
  if (!dataUrl.startsWith("data:")) return dataUrl;
  try {
    const [header, base64] = dataUrl.split(",");
    if (!base64) return dataUrl;
    
    const mimeType =
      header.match(/data:([^;]+)/)?.[1] ?? "application/octet-stream";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("PrivateImage: Blob conversion failed:", error);
    return dataUrl;
  }
}

/**
 * Renders an image from a media file path, fetching and converting to Blob URL on mount.
 * Also handles legacy https:// URLs directly.
 * Uses request queuing to avoid overwhelming the server with too many concurrent requests.
 */
export function PrivateImage({ src, alt, fill, className }: PrivateImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    // Pass through absolute URLs unchanged
    if (src.startsWith("http") || src.startsWith("blob:") || src.startsWith("data:")) {
      setBlobUrl(src);
      setIsLoading(false);
      return;
    }

    // Fetch repo-relative media file with request queuing
    setIsLoading(true);
    requestQueue.enqueue(async () => {
      try {
        const result = await getMediaDataUrlAction(src);
        if (result.success) {
          const url = dataUrlToBlobUrl(result.data);
          setBlobUrl(url);
        } else {
          console.error(`PrivateImage: Failed to fetch ${src}:`, result.error);
        }
      } catch (error) {
        console.error(`PrivateImage: Exception fetching ${src}:`, error);
      } finally {
        setIsLoading(false);
      }
    });
  }, [src]);

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
