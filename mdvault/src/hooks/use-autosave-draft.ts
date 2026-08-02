import { useEffect, useRef, useState } from "react";

const DRAFT_PREFIX = "mdvault:draft:";

export interface StoredDraft<T> {
	data: T;
	savedAt: string;
}

function storageKey(key: string) {
	return `${DRAFT_PREFIX}${key}`;
}

export function loadDraft<T>(key: string): StoredDraft<T> | null {
	if (typeof window === "undefined") {
		return null;
	}

	try {
		const raw = window.localStorage.getItem(storageKey(key));
		if (!raw) {
			return null;
		}
		const parsed = JSON.parse(raw) as StoredDraft<T>;
		if (!parsed || typeof parsed.savedAt !== "string") {
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}

export function saveDraft<T>(key: string, data: T) {
	if (typeof window === "undefined") {
		return;
	}

	try {
		const payload: StoredDraft<T> = { data, savedAt: new Date().toISOString() };
		window.localStorage.setItem(storageKey(key), JSON.stringify(payload));
	} catch {}
}

export function clearDraft(key: string) {
	if (typeof window === "undefined") {
		return;
	}

	try {
		window.localStorage.removeItem(storageKey(key));
	} catch {}
}

interface UseAutosaveDraftOptions {
	enabled: boolean;
	delay?: number;
}

/**
 * Debounced localStorage autosave. Persists `data` under `key` while `enabled`
 * is true, and returns the timestamp of the last local save.
 */
export function useAutosaveDraft<T>(
	key: string,
	data: T,
	{ enabled, delay = 1000 }: UseAutosaveDraftOptions,
) {
	const [savedAt, setSavedAt] = useState<string | null>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		timeoutRef.current = setTimeout(() => {
			saveDraft(key, data);
			setSavedAt(new Date().toISOString());
		}, delay);

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [key, data, enabled, delay]);

	return { savedAt };
}
