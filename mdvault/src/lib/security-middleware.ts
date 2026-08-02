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
 * `X-Forwarded-For` is attacker controlled unless a reverse proxy in front of
 * this app is known to rewrite it. Trusting it by default would let any caller
 * mint a fresh rate limit bucket per request, so it is opt-in.
 */
function isProxyTrusted() {
	return process.env.TRUSTED_PROXY === "true";
}

function getClientKey() {
	// MDVault runs on the machine using it, so a single local bucket is the
	// correct default when no trusted proxy is configured.
	return getRequestIP({ xForwardedFor: isProxyTrusted() }) ?? "local";
}

/**
 * Cross-site requests must not drive mutations. CSRF tokens (see `src/start.ts`)
 * are the primary defence; these checks are the cheap second line.
 *
 * `Sec-Fetch-Site` is set by the browser and cannot be forged from script, so a
 * write that declares itself cross-site is rejected outright. `Origin` is then
 * required to match whenever it is present.
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

/**
 * The request body is also bounded where it actually matters - the upload
 * validator caps the decoded image - so this only rejects obvious abuse early.
 */
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
