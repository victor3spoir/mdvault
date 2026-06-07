import { Image } from "@unpic/react";
import { useEffect, useState } from "react";
import { getMediaDataUrlFn } from "#/features/media/media.functions";
import { cn } from "#/lib/utils";

interface PrivateImageProps {
	src: string;
	alt: string;
	className?: string;
}

export function PrivateImage({ src, alt, className }: PrivateImageProps) {
	const [resolvedSrc, setResolvedSrc] = useState(
		src.startsWith("http") || src.startsWith("data:") ? src : "",
	);

	useEffect(() => {
		let cancelled = false;

		async function resolveImage() {
			if (!src || src.startsWith("http") || src.startsWith("data:")) {
				setResolvedSrc(src);
				return;
			}

			try {
				const dataUrl = await getMediaDataUrlFn({ data: { path: src } });
				if (!cancelled) {
					setResolvedSrc(dataUrl);
				}
			} catch {
				if (!cancelled) {
					setResolvedSrc("");
				}
			}
		}

		resolveImage();

		return () => {
			cancelled = true;
		};
	}, [src]);

	if (!resolvedSrc) {
		return (
			<div
				className={cn(
					"flex items-center justify-center bg-muted text-xs text-muted-foreground",
					className,
				)}
			>
				Loading...
			</div>
		);
	}

	return (
		<Image
			src={resolvedSrc}
			alt={alt}
			className={className}
			layout="constrained"
			width={100}
			height={100}
		/>
	);
}
