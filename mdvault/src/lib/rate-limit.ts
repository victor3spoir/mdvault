export interface RateLimiterOptions {
	/** Length of the counting window in milliseconds. */
	windowMs: number;
	/**
	 * Hard ceiling on tracked keys. Without it a caller that varies its identity
	 * every request would grow the map until the process runs out of memory -
	 * the rate limiter itself becomes the denial of service.
	 */
	maxEntries: number;
}

interface Window {
	count: number;
	resetAt: number;
}

export interface RateLimiter {
	/** Records a hit for `key`, returning false once `limit` is exceeded. */
	consume: (key: string, limit: number, now?: number) => boolean;
	/** Number of keys currently tracked. Exposed for tests and diagnostics. */
	size: () => number;
}

export function createRateLimiter({
	windowMs,
	maxEntries,
}: RateLimiterOptions): RateLimiter {
	const windows = new Map<string, Window>();

	function sweepExpired(now: number) {
		for (const [key, window] of windows) {
			if (window.resetAt <= now) {
				windows.delete(key);
			}
		}
	}

	return {
		consume(key, limit, now = Date.now()) {
			const current = windows.get(key);

			if (current && current.resetAt > now) {
				if (current.count >= limit) {
					return false;
				}

				current.count += 1;
				return true;
			}

			if (windows.size >= maxEntries) {
				sweepExpired(now);
			}

			if (windows.size >= maxEntries) {
				return false;
			}

			windows.set(key, { count: 1, resetAt: now + windowMs });
			return true;
		},

		size() {
			return windows.size;
		},
	};
}
