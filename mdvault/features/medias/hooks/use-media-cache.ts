"use client";

import { useEffect, useState } from "react";
import { getAllMediaDataUrlsAction } from "../medias.actions";

interface MediaCacheState {
	cache: Record<string, string>;
	isLoading: boolean;
}

// Module-level singleton — shared across ALL component instances on the page.
// This ensures only ONE bulk API call is made regardless of how many
// PrivateImage / useMediaCache() consumers are mounted simultaneously.
//
// The cache stores Blob URLs (blob:http://...) instead of data:URLs.
// Blob URLs are short strings; the binary data lives outside the V8 heap in
// the browser's dedicated Blob store, dramatically reducing JS memory pressure
// when handling large image sets.
let moduleCache: Record<string, string> | null = null;
let inflightPromise: Promise<Record<string, string>> | null = null;
const subscribers = new Set<(cache: Record<string, string>) => void>();

/**
 * Converts a base64 data URL like `data:image/png;base64,...` into a Blob URL.
 * Falls back to returning the original string for non–data: URLs so https://
 * and already-converted blob: URLs pass through safely.
 */
function dataUrlToBlobUrl(dataUrl: string): string {
	if (!dataUrl.startsWith("data:")) return dataUrl;
	try {
		const [header, base64] = dataUrl.split(",");
		const mimeType = header.match(/data:([^;]+)/)?.[1] ?? "application/octet-stream";
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		const blob = new Blob([bytes], { type: mimeType });
		return URL.createObjectURL(blob);
	} catch {
		// If conversion fails for any reason, fall back to the original data URL.
		return dataUrl;
	}
}

/** Revokes all blob: URLs stored in a cache map to prevent memory leaks. */
function revokeBlobUrls(cache: Record<string, string>): void {
	for (const url of Object.values(cache)) {
		if (url.startsWith("blob:")) {
			URL.revokeObjectURL(url);
		}
	}
}

function fetchModuleCache(): Promise<Record<string, string>> {
	if (inflightPromise) return inflightPromise;

	inflightPromise = getAllMediaDataUrlsAction().then((result) => {
		const dataUrls = result.success ? result.data : {};

		// Convert every data:URL received from the server into a Blob URL.
		// This keeps the JS cache lean (short blob: strings) while the binary
		// data is managed efficiently by the browser outside the V8 heap.
		const blobUrlMap: Record<string, string> = {};
		for (const [path, dataUrl] of Object.entries(dataUrls)) {
			blobUrlMap[path] = dataUrlToBlobUrl(dataUrl);
		}

		moduleCache = blobUrlMap;
		inflightPromise = null;
		for (const notify of subscribers) notify(blobUrlMap);
		return blobUrlMap;
	});

	return inflightPromise;
}

/**
 * Hybrid media cache hook.
 * Fetches all media from the server in one bulk call, converts each result
 * to a Blob URL, and stores those in a module-level singleton shared by every
 * component instance on the page.
 *
 * Server-side: cached via `cacheTag("medias")`, invalidated on upload/delete.
 * Client-side: module-level singleton persists across component mount/unmount.
 * Blob URLs are revoked when the cache is invalidated to prevent memory leaks.
 */
export function useMediaCache() {
	const [state, setState] = useState<MediaCacheState>({
		cache: moduleCache ?? {},
		isLoading: moduleCache === null,
	});

	useEffect(() => {
		// Already populated — sync state immediately, no fetch needed.
		if (moduleCache !== null) {
			setState({ cache: moduleCache, isLoading: false });
			return;
		}

		const notify = (cache: Record<string, string>) => {
			setState({ cache, isLoading: false });
		};
		subscribers.add(notify);
		fetchModuleCache();

		return () => {
			subscribers.delete(notify);
		};
	}, []);

	/** Look up a Blob URL. Trims whitespace before lookup to handle dirty stored paths. */
	const resolve = (src: string): string | null => {
		const trimmed = src?.trim();
		if (!trimmed) return null;
		// Pass through absolute URLs (https://, blob:, data: etc.) unchanged.
		if (trimmed.startsWith("http") || trimmed.startsWith("blob:") || trimmed.startsWith("data:"))
			return trimmed;
		return state.cache[trimmed] ?? null;
	};

	/** Invalidates module cache, revokes all Blob URLs, and re-fetches. */
	const invalidate = () => {
		// Revoke existing Blob URLs before discarding them to free browser memory.
		if (moduleCache) revokeBlobUrls(moduleCache);
		moduleCache = null;
		inflightPromise = null;
		setState({ cache: {}, isLoading: true });
		fetchModuleCache().then((data) => {
			setState({ cache: data, isLoading: false });
		});
	};

	return { ...state, resolve, invalidate };
}
