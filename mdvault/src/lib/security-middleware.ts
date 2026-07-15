import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

const RATE_WINDOW_MS = 60_000;
const MAX_GET_REQUESTS = 300;
const MAX_WRITE_REQUESTS = 20;
const MAX_REQUEST_BYTES = 8 * 1024 * 1024;

const requestCounts = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: Request) {
	return (
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		request.headers.get("x-real-ip") ||
		"unknown"
	);
}

function isTrustedOrigin(request: Request) {
	const origin = request.headers.get("origin");
	if (!origin) return true;
	if (origin === "null") return false;

	const requestOrigin = new URL(request.url).origin;
	return origin === requestOrigin || origin === process.env.SERVER_URL;
}

function consumeRateLimit(key: string, limit: number) {
	const now = Date.now();
	const current = requestCounts.get(key);

	if (!current || current.resetAt <= now) {
		requestCounts.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
		return true;
	}

	if (current.count >= limit) return false;
	current.count += 1;
	return true;
}

export const securityMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const request = getRequest();
		const method = request.method.toUpperCase();
		const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

		if (isWrite && !isTrustedOrigin(request)) {
			throw new Error("Forbidden origin");
		}

		const contentLength = Number(request.headers.get("content-length") ?? 0);
		if (contentLength > MAX_REQUEST_BYTES) {
			throw new Error("Request body is too large");
		}

		const limit = isWrite ? MAX_WRITE_REQUESTS : MAX_GET_REQUESTS;
		if (!consumeRateLimit(`${getClientKey(request)}:${method}`, limit)) {
			throw new Error("Too many requests");
		}

		return next();
	},
);
