/**
 * Image size/alignment persisted through markdown via a URL fragment:
 * `![alt](media/img.png#w=50&align=center)`. The fragment is not part of the
 * repository path, so media fetching keeps working after a round-trip.
 */

export type ImageAlign = "left" | "center" | "right";

export interface ImageDisplayAttrs {
	width: number | null;
	align: ImageAlign | null;
}

const VALID_WIDTHS = new Set([25, 50, 75, 100]);
const VALID_ALIGNS = new Set<ImageAlign>(["left", "center", "right"]);

export function splitImageSource(source: string): {
	src: string;
	attrs: ImageDisplayAttrs;
} {
	const hashIndex = source.indexOf("#");
	if (hashIndex === -1) {
		return { src: source, attrs: { width: null, align: null } };
	}

	const src = source.slice(0, hashIndex);
	const params = new URLSearchParams(source.slice(hashIndex + 1));

	const rawWidth = Number(params.get("w"));
	const width = VALID_WIDTHS.has(rawWidth) ? rawWidth : null;

	const rawAlign = params.get("align") as ImageAlign | null;
	const align = rawAlign && VALID_ALIGNS.has(rawAlign) ? rawAlign : null;

	return { src, attrs: { width, align } };
}

export function joinImageSource(src: string, attrs: ImageDisplayAttrs) {
	const params = new URLSearchParams();
	if (attrs.width && attrs.width !== 100) {
		params.set("w", String(attrs.width));
	}
	if (attrs.align && attrs.align !== "center") {
		params.set("align", attrs.align);
	}
	const query = params.toString();
	return query ? `${src}#${query}` : src;
}
