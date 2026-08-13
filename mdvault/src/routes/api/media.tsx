import { createFileRoute } from "@tanstack/react-router";
import { getMedia, parseWidth } from "#/features/media/media-store.server";
import { getGitHubEnv } from "#/integrations/github/github-env.server";
import { getRepositoryMediaFilePath } from "#/lib/repository-path";

/**
 * Serves repository media as ordinary image bytes.
 *
 * Previously these were inlined as base64 data URLs, which put tens of
 * megabytes into the SSR payload and could not be cached by the browser. A URL
 * costs a few bytes in the document and is cached, lazy-loaded and fetched in
 * parallel like any other image.
 *
 * The filename travels as a query parameter rather than a path segment: a path
 * ending in `.png` is claimed by the static-asset middleware before the router
 * ever sees it, and the request silently falls through to the 404 page.
 *
 * `?v=<sha>` marks a response immutable, and `?w=<width>` asks for a downscaled
 * WebP - the grid uses it so a page of thumbnails does not pull the full-size
 * assets.
 */
export const Route = createFileRoute("/api/media")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const file = url.searchParams.get("file");

				if (!file) {
					return new Response("Missing file", { status: 400 });
				}

				const env = getGitHubEnv();
				const path = getRepositoryMediaFilePath(env.MEDIA_PATH, file);

				if (!path) {
					return new Response("Not found", { status: 404 });
				}

				const version = url.searchParams.get("v") ?? undefined;
				const width = parseWidth(url.searchParams.get("w"));
				const outcome = await getMedia(path, { version, width });

				if (outcome.status === "not-found") {
					return new Response("Not found", { status: 404 });
				}

				if (outcome.status === "rate-limited") {
					return new Response("Too many requests", {
						status: 429,
						headers: { "Retry-After": String(outcome.retryAfterSeconds) },
					});
				}

				if (outcome.status === "error") {
					return new Response(outcome.message, { status: 502 });
				}

				const { bytes, contentType, etag } = outcome.blob;

				if (request.headers.get("if-none-match") === etag) {
					return new Response(null, { status: 304, headers: { ETag: etag } });
				}

				return new Response(bytes as unknown as BodyInit, {
					headers: {
						"Content-Type": contentType,
						"Content-Length": String(bytes.length),
						ETag: etag,
						"Cache-Control": version
							? "public, max-age=31536000, immutable"
							: "public, max-age=60, stale-while-revalidate=604800",
						"X-Content-Type-Options": "nosniff",
					},
				});
			},
		},
	},
});
