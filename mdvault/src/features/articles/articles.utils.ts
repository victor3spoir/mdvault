export function getContentStats(content: string) {
	if (!content || typeof content !== "string") {
		return { wordCount: 0, readTime: 0 };
	}

	const wordCount = content.split(/\s+/).filter(Boolean).length;
	return {
		wordCount,
		readTime: Math.max(1, Math.ceil(wordCount / 200)),
	};
}
