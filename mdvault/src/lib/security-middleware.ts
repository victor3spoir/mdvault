import { createMiddleware } from "@tanstack/react-start";
import { getRequest, getRequestIP } from "@tanstack/react-start/server";
import { createRateLimiter } from "#/lib/rate-limit";

const RATE_WINDOW_MS = 60_000;
const MAX_GET_REQUESTS = 300;
const MAX_WRITE_REQUESTS = 20;
const MAX_REQUEST_BYTES = 8 * 1024 * 1024;
const MAX_TRACKED_CLIENTS = 10_000;

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const rateLimiter = createRateLimiter({
	windowMs: RATE_WINDOW_MS,
	maxEntries: MAX_TRACKED_CLIENTS,
});

/**
 * `X-Forwarded-For` is attacker controlled without a trusted proxy in front,
 * so honouring it is opt-in.
 */
function isProxyTrusted() {
	return process.env.TRUSTED_PROXY === "true";
}

function getClientKey() {
	return getRequestIP({ xForwardedFor: isProxyTrusted() }) ?? "local";
}

/**
 * Second line behind the CSRF tokens in `src/start.ts`: `Sec-Fetch-Site` cannot
 * be forged from script, and `Origin` must match whenever present.
 */
export function isTrustedOrigin(request: Request, serverUrl?: string) {
	const fetchSite = request.headers.get("sec-fetch-site");
	if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
		return false;
	}

	const origin = request.headers.get("origin");
	if (!origin) {
		return true;
	}
	if (origin === "null") {
		return false;
	}

	return origin === new URL(request.url).origin || origin === serverUrl;
}

/** Early rejection only: the upload validator caps the decoded image. */
function isBodyTooLarge(request: Request) {
	const contentLength = Number(request.headers.get("content-length") ?? 0);
	return Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES;
}

export const securityMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const request = getRequest();
		const method = request.method.toUpperCase();
		const isWrite = WRITE_METHODS.has(method);

		if (isWrite && !isTrustedOrigin(request, process.env.SERVER_URL)) {
			throw new Error("Forbidden origin");
		}

		if (isBodyTooLarge(request)) {
			throw new Error("Request body is too large");
		}

		const limit = isWrite ? MAX_WRITE_REQUESTS : MAX_GET_REQUESTS;
		if (!rateLimiter.consume(`${getClientKey()}:${method}`, limit)) {
			throw new Error("Too many requests");
		}

		return next();
	},
);
