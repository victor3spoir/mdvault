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
let moduleCache: Record<string, string> | null = null;
let inflightPromise: Promise<Record<string, string>> | null = null;
const subscribers = new Set<(cache: Record<string, string>) => void>();

function fetchModuleCache(): Promise<Record<string, string>> {
	if (inflightPromise) return inflightPromise;

	inflightPromise = getAllMediaDataUrlsAction().then((result) => {
		const data = result.success ? result.data : {};
		moduleCache = data;
		inflightPromise = null;
		for (const notify of subscribers) notify(data);
		return data;
	});

	return inflightPromise;
}

/**
 * Hybrid media cache hook.
 * Fetches all media data:URLs from the server in one bulk call and stores
 * them in a module-level singleton for instant O(1) lookups across ALL
 * component instances on the page.
 *
 * Server-side: cached via `cacheTag("medias")`, invalidated on upload/delete.
 * Client-side: module-level singleton persists across component mount/unmount.
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

	/** Look up a data:URL. Trims whitespace before lookup to handle dirty stored paths. */
	const resolve = (src: string): string | null => {
		const trimmed = src?.trim();
		if (!trimmed) return null;
		if (trimmed.startsWith("http") || trimmed.startsWith("data:"))
			return trimmed;
		return state.cache[trimmed] ?? null;
	};

	/** Invalidates module cache and re-fetches (e.g. after upload/delete). */
	const invalidate = () => {
		moduleCache = null;
		inflightPromise = null;
		setState({ cache: {}, isLoading: true });
		fetchModuleCache().then((data) => {
			setState({ cache: data, isLoading: false });
		});
	};

	return { ...state, resolve, invalidate };
}
