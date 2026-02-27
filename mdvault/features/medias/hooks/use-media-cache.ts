"use client";

import { useState } from "react";
import { getMediaDataUrlAction } from "../medias.actions";

interface MediaCacheState {
  cache: Record<string, string>;
  isLoading: Record<string, boolean>;
}

// Module-level singleton — shared across ALL component instances on the page.
// This map stores individual file fetch promises to deduplicate requests.
const inflightFetches = new Map<string, Promise<Record<string, string>>>();

/**
 * Converts a base64 data URL like `data:image/png;base64,...` into a Blob URL.
 * Falls back to returning the original string for non–data: URLs so https://
 * and already-converted blob: URLs pass through safely.
 */
function dataUrlToBlobUrl(dataUrl: string): string {
  if (!dataUrl.startsWith("data:")) return dataUrl;
  try {
    const [header, base64] = dataUrl.split(",");
    if (!base64) {
      console.warn("Media cache: data URL missing comma separator");
      return dataUrl;
    }
    
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
    // If conversion fails for any reason, fall back to the original data URL.
    console.error("Media cache: Blob URL conversion failed:", error instanceof Error ? error.message : String(error));
    return dataUrl;
  }
}

/** Revokes a single blob: URL to prevent memory leaks. */
function revokeBlobUrl(url: string): void {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Fetch a single media file's data URL and convert to Blob URL.
 * Deduplicates concurrent requests for the same file.
 */
function fetchMediaFile(filePath: string): Promise<{ blobUrl: string } | null> {
  // Check if already in flight for this specific file
  const inFlightKey = `single-${filePath}`;
  if (inflightFetches.has(inFlightKey)) {
    return (inflightFetches.get(inFlightKey) as Promise<Record<string, string>>).then(() => ({ blobUrl: null }));
  }

  const promise = getMediaDataUrlAction(filePath).then((result) => {
    inflightFetches.delete(inFlightKey);
    if (!result.success) {
      console.error(`Media cache: Failed to fetch ${filePath}:`, result.error);
      return {};
    }
    
    const blobUrl = dataUrlToBlobUrl(result.data);
    return { [filePath]: blobUrl };
  }).catch((error) => {
    inflightFetches.delete(inFlightKey);
    console.error(`Media cache: Exception fetching ${filePath}:`, error);
    return {};
  });

  inflightFetches.set(inFlightKey, promise as any);
  return promise.then(() => ({ blobUrl: null }));
}

/**
 * On-demand media cache hook.
 * Fetches media individually as requested, converting each to a Blob URL.
 * Deduplicates concurrent requests for shared files.
 */
export function useMediaCache() {
  const [cache, setCache] = useState<Record<string, string>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  /** Look up a Blob URL or fetch it if not cached.  */
  const resolve = (src: string): string | null => {
    const trimmed = src?.trim();
    if (!trimmed) return null;
    // Pass through absolute URLs (https://, blob:, data: etc.) unchanged.
    if (
      trimmed.startsWith("http") ||
      trimmed.startsWith("blob:") ||
      trimmed.startsWith("data:")
    )
      return trimmed;
    
    // Check if already cached
    if (trimmed in cache) {
      return cache[trimmed];
    }

    // Not cached and not currently loading - start fetch
    if (!(trimmed in loadingStates)) {
      setLoadingStates(prev => ({ ...prev, [trimmed]: true }));
      
      getMediaDataUrlAction(trimmed).then((result) => {
        if (result.success) {
          const blobUrl = dataUrlToBlobUrl(result.data);
          setCache(prev => ({ ...prev, [trimmed]: blobUrl }));
        }
        setLoadingStates(prev => {
          const next = { ...prev };
          delete next[trimmed];
          return next;
        });
      }).catch((error) => {
        console.error(`Media cache: Failed to fetch ${trimmed}:`, error);
        setLoadingStates(prev => {
          const next = { ...prev };
          delete next[trimmed];
          return next;
        });
      });
    }

    return null;
  };

  /** Invalidate cache and revoke Blob URLs. */
  const invalidate = () => {
    for (const url of Object.values(cache)) {
      revokeBlobUrl(url);
    }
    setCache({});
    setLoadingStates({});
    inflightFetches.clear();
  };

  const isLoading = Object.keys(loadingStates).length > 0;

  return { cache, isLoading, resolve, invalidate };
}
