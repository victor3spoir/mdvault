export const CALLOUT_TYPES = [
	"note",
	"tip",
	"important",
	"warning",
	"caution",
] as const;

export type CalloutType = (typeof CALLOUT_TYPES)[number];

export function isCalloutType(value: unknown): value is CalloutType {
	return (
		typeof value === "string" &&
		CALLOUT_TYPES.includes(value.toLowerCase() as CalloutType)
	);
}

export function normalizeCalloutType(value: unknown): CalloutType {
	return isCalloutType(value) ? (value.toLowerCase() as CalloutType) : "note";
}

export function calloutLabel(type: CalloutType) {
	return type.charAt(0).toUpperCase() + type.slice(1);
}

export function normalizeCalloutMarkdown(source: string) {
	const parts = source.split(/(\r\n|\n|\r)/);
	let fence: { marker: "`" | "~"; length: number } | null = null;
	let result = "";

	for (let index = 0; index < parts.length; index += 2) {
		const line = parts[index] ?? "";
		const newline = parts[index + 1] ?? "";
		const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})/);

		if (fenceMatch) {
			const marker = fenceMatch[1]?.[0] as "`" | "~";
			const length = fenceMatch[1]?.length ?? 0;
			if (!fence) {
				fence = { marker, length };
			} else if (marker === fence.marker && length >= fence.length) {
				fence = null;
			}
		}

		const nextLine = parts[index + 2] ?? "";
		const isCompactCallout =
			!fence &&
			/^>[^\S\r\n]*\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][^\S\r\n]*$/i.test(
				line,
			) &&
			/^>[^\r\n]/.test(nextLine);

		result += line + newline;
		if (isCompactCallout && newline) {
			result += `>${newline}`;
		}
	}

	return result;
}
