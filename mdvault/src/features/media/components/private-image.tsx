import { normalizeMediaSource } from "#/features/media/media.utils";
import { cn } from "#/lib/utils";

interface PrivateImageProps {
	src: string;
	alt: string;
	className?: string;
	/** Blob SHA when known: makes the response immutable and skips revalidation. */
	version?: string;
	/** Ask for a downscaled WebP instead of the full asset. */
	width?: 200 | 400 | 800 | 1600;
	/** Above-the-fold images should not be lazy. */
	priority?: boolean;
}

/**
 * Builds the proxy URL for a repository media path.
 *
 * The bytes are served by `/api/media/*` rather than inlined as a data URL, so
 * the browser caches them, loads them lazily and fetches them in parallel.
 */
export function mediaUrl(
	src: string,
	{ version, width }: { version?: string; width?: number } = {},
) {
	const path = normalizeMediaSource(src);

	if (!path) {
		return "";
	}

	if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) {
		return path;
	}

	// Media is flat inside the media directory, so the filename identifies it
	// and the client never needs to know how that directory is named.
	const filename = path.split("/").pop() ?? "";
	if (!filename) {
		return "";
	}

	const params = new URLSearchParams({ file: filename });
	if (version) {
		params.set("v", version);
	}
	if (width) {
		params.set("w", String(width));
	}

	return `/api/media?${params.toString()}`;
}

export function PrivateImage({
	src,
	alt,
	className,
	version,
	width,
	priority = false,
}: PrivateImageProps) {
	const resolved = mediaUrl(src, { version, width });

	if (!resolved) {
		return <div className={cn("bg-muted", className)} aria-hidden="true" />;
	}

	return (
		<img
			src={resolved}
			alt={alt}
			draggable={false}
			loading={priority ? "eager" : "lazy"}
			decoding="async"
			className={className}
		/>
	);
}
