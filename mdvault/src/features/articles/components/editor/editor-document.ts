export interface EditorDocumentNode {
	type?: string;
	attrs?: Record<string, unknown>;
	marks?: EditorDocumentMark[];
	text?: string;
	content?: EditorDocumentNode[];
}

export interface EditorDocumentMark {
	type?: string;
	attrs?: Record<string, unknown>;
}

export interface EditorOutlineEntry {
	text: string;
	level: number;
	slug: string;
	position: number;
}

export type EditorDocumentIssueType =
	| "missing-image-alt"
	| "generic-image-alt"
	| "duplicate-heading"
	| "broken-fragment-link"
	| "empty-link-href"
	| "unsafe-link-href";

export interface EditorDocumentIssue {
	type: EditorDocumentIssueType;
	message: string;
	position: number;
	href?: string;
}

interface NodeVisit {
	node: EditorDocumentNode;
	position: number;
}

interface LinkVisit {
	href: string;
	position: number;
	end: number;
}

const GENERIC_IMAGE_ALT =
	/^(image|img|photo|picture|screenshot|graphic)(?:\s*[-_#]?\s*\d+)?$/i;
const IMAGE_FILE_NAME = /^[^\s/\\]+\.(avif|gif|jpe?g|png|svg|webp)$/i;
const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

function nodeSize(node: EditorDocumentNode): number {
	if (node.type === "text") {
		return node.text?.length ?? 0;
	}
	if (!node.content?.length) {
		return 1;
	}
	return 2 + node.content.reduce((size, child) => size + nodeSize(child), 0);
}

function visitDocument(
	document: EditorDocumentNode,
	visitor: (visit: NodeVisit) => void,
) {
	function visitChildren(node: EditorDocumentNode, start: number) {
		let position = start;
		for (const child of node.content ?? []) {
			visitor({ node: child, position });
			if (child.content?.length) {
				visitChildren(child, position + 1);
			}
			position += nodeSize(child);
		}
	}

	visitChildren(document, 0);
}

function nodeText(node: EditorDocumentNode): string {
	if (node.type === "text") {
		return node.text ?? "";
	}
	return (node.content ?? []).map(nodeText).join("");
}

export function normalizeEditorHeading(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

export function extractEditorOutline(
	document: EditorDocumentNode,
): EditorOutlineEntry[] {
	const outline: EditorOutlineEntry[] = [];
	const slugCounts = new Map<string, number>();

	visitDocument(document, ({ node, position }) => {
		if (node.type !== "heading") {
			return;
		}

		const level = Number(node.attrs?.level);
		if (!Number.isInteger(level) || level < 2 || level > 6) {
			return;
		}

		const text = nodeText(node).replace(/\s+/g, " ").trim();
		const baseSlug = normalizeEditorHeading(text) || "section";
		const count = slugCounts.get(baseSlug) ?? 0;
		slugCounts.set(baseSlug, count + 1);

		outline.push({
			text,
			level,
			slug: count === 0 ? baseSlug : `${baseSlug}-${count + 1}`,
			position,
		});
	});

	return outline;
}

function isGenericImageAlt(value: string): boolean {
	const normalized = value.replace(/\s+/g, " ").trim();
	return GENERIC_IMAGE_ALT.test(normalized) || IMAGE_FILE_NAME.test(normalized);
}

function normalizedUrlProbe(value: string): string {
	return (
		value
			.trim()
			// biome-ignore lint/suspicious/noControlCharactersInRegex: URL protocols can be obfuscated with control characters.
			.replace(/[\u0000-\u0020\u007f-\u009f]/g, "")
			.toLowerCase()
	);
}

export function isSafeEditorHref(href: string): boolean {
	const probe = normalizedUrlProbe(href);
	if (!probe) {
		return false;
	}
	if (
		probe.startsWith("#") ||
		probe.startsWith("/") ||
		probe.startsWith("./") ||
		probe.startsWith("../") ||
		probe.startsWith("?")
	) {
		return true;
	}

	const protocol = /^[a-z][a-z0-9+.-]*:/.exec(probe)?.[0];
	return protocol ? SAFE_LINK_PROTOCOLS.has(protocol) : true;
}

function collectLinks(document: EditorDocumentNode): LinkVisit[] {
	const links: LinkVisit[] = [];

	visitDocument(document, ({ node, position }) => {
		const hrefs: string[] = [];
		if (node.type === "link") {
			hrefs.push(typeof node.attrs?.href === "string" ? node.attrs.href : "");
		}
		for (const mark of node.marks ?? []) {
			if (mark.type === "link") {
				hrefs.push(typeof mark.attrs?.href === "string" ? mark.attrs.href : "");
			}
		}

		const end = position + Math.max(nodeSize(node), 1);
		for (const href of hrefs) {
			const previous = links.at(-1);
			if (previous && previous.href === href && previous.end === position) {
				previous.end = end;
			} else {
				links.push({ href, position, end });
			}
		}
	});

	return links;
}

function fragmentFromHref(href: string): string {
	const fragment = href.slice(1);
	try {
		return decodeURIComponent(fragment);
	} catch {
		return fragment;
	}
}

export function analyzeEditorDocument(
	document: EditorDocumentNode,
): EditorDocumentIssue[] {
	const issues: EditorDocumentIssue[] = [];
	const outline = extractEditorOutline(document);
	const headingCounts = new Map<string, number>();

	for (const heading of outline) {
		const normalized = normalizeEditorHeading(heading.text) || "section";
		const count = headingCounts.get(normalized) ?? 0;
		headingCounts.set(normalized, count + 1);
		if (count > 0) {
			issues.push({
				type: "duplicate-heading",
				message: `Heading "${heading.text || "Untitled"}" is duplicated.`,
				position: heading.position,
			});
		}
	}

	visitDocument(document, ({ node, position }) => {
		if (node.type !== "image") {
			return;
		}

		const alt =
			typeof node.attrs?.alt === "string" ? node.attrs.alt.trim() : "";
		if (!alt) {
			issues.push({
				type: "missing-image-alt",
				message: "Image is missing alternative text.",
				position,
			});
		} else if (isGenericImageAlt(alt)) {
			issues.push({
				type: "generic-image-alt",
				message: `Image alternative text "${alt}" is too generic.`,
				position,
			});
		}
	});

	const validFragments = new Set(outline.map(({ slug }) => slug));

	for (const link of collectLinks(document)) {
		const href = link.href.trim();
		if (!href) {
			issues.push({
				type: "empty-link-href",
				message: "Link has no destination.",
				position: link.position,
				href,
			});
			continue;
		}
		if (!isSafeEditorHref(href)) {
			issues.push({
				type: "unsafe-link-href",
				message: `Link uses an unsafe URL: ${href}`,
				position: link.position,
				href,
			});
			continue;
		}
		if (href.startsWith("#")) {
			const fragment = fragmentFromHref(href);
			if (!fragment || !validFragments.has(fragment)) {
				issues.push({
					type: "broken-fragment-link",
					message: `Link points to a missing heading: ${href}`,
					position: link.position,
					href,
				});
			}
		}
	}

	return issues.sort(
		(left, right) =>
			left.position - right.position || left.type.localeCompare(right.type),
	);
}
