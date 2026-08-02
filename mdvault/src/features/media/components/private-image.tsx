import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { mediaDataUrlQueryOptions } from "#/features/media/media.queries";
import { cn } from "#/lib/utils";

interface PrivateImageProps {
	src: string;
	alt: string;
	className?: string;
}

/**
 * Renders an image from a private repository, which has to be fetched through
 * the server before it can be displayed.
 *
 * Because that resolution is asynchronous, the image would otherwise replace
 * the placeholder in a single frame. Fading it in over the placeholder bridges
 * the swap instead of letting it snap.
 */
export function PrivateImage({ src, alt, className }: PrivateImageProps) {
	const query = useQuery(mediaDataUrlQueryOptions(src));
	const [loaded, setLoaded] = useState(false);
	const resolvedSrc = query.data ?? "";

	if (!resolvedSrc) {
		return (
			<div
				className={cn("animate-pulse bg-muted", className)}
				aria-hidden="true"
			/>
		);
	}

	return (
		<img
			src={resolvedSrc}
			alt={alt}
			draggable={false}
			onLoad={() => setLoaded(true)}
			className={cn(
				"transition-opacity duration-200 ease-out",
				loaded ? "opacity-100" : "opacity-0",
				className,
			)}
		/>
	);
}
