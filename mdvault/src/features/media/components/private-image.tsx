import { useQuery } from "@tanstack/react-query";
import { mediaDataUrlQueryOptions } from "#/features/media/media.queries";
import { cn } from "#/lib/utils";

interface PrivateImageProps {
	src: string;
	alt: string;
	className?: string;
}

export function PrivateImage({ src, alt, className }: PrivateImageProps) {
	const query = useQuery(mediaDataUrlQueryOptions(src));
	const resolvedSrc = query.data ?? "";

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
		<img src={resolvedSrc} alt={alt} className={className} draggable={false} />
	);
}
