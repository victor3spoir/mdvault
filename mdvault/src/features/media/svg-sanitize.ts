/**
 * An SVG is a document, not a bitmap: it can carry scripts and remote
 * references. Uploads land in a repository other sites read and may inline, so
 * the dangerous constructs are removed once, on the way in.
 */

const SCRIPT_ELEMENTS = [
	"script",
	"foreignObject",
	"iframe",
	"embed",
	"object",
	"audio",
	"video",
	"animate",
	"set",
	"handler",
];

/** Attributes that can execute or fetch. */
const DANGEROUS_ATTRIBUTE =
	/\s(on\w+|xlink:href|href|src|data|from|to|values|begin)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;

const URL_ATTRIBUTES = new Set(["href", "xlink:href", "src", "data"]);

function isSafeUrl(value: string) {
	// Control characters and whitespace are stripped first: `java\nscript:` and
	// ` javascript:` are both parsed as executable by browsers.
	const url = value
		.trim()
		// biome-ignore lint/suspicious/noControlCharactersInRegex: removing them is the point
		.replace(/[\u0000-\u001f\s]/g, "");

	if (url.startsWith("#")) {
		return true;
	}
	if (/^data:image\/(png|jpeg|gif|webp);base64,/i.test(url)) {
		return true;
	}

	return false;
}

/** Returns true when the payload actually looks like an SVG document. */
export function isSvgDocument(source: string) {
	return /<svg[\s>]/i.test(source);
}

export interface SvgSanitizeResult {
	svg: string;
	/** What was stripped, for logging and for telling the user. */
	removed: string[];
}

export function sanitizeSvg(source: string): SvgSanitizeResult {
	const removed: string[] = [];
	let svg = source;

	// Doctypes and entity declarations enable billion-laughs style expansion.
	if (/<!DOCTYPE|<!ENTITY/i.test(svg)) {
		svg = svg
			.replace(/<!DOCTYPE[\s\S]*?>/gi, "")
			.replace(/<!ENTITY[\s\S]*?>/gi, "");
		removed.push("doctype");
	}

	svg = svg.replace(/<\?xml-stylesheet[\s\S]*?\?>/gi, () => {
		removed.push("xml-stylesheet");
		return "";
	});

	for (const tag of SCRIPT_ELEMENTS) {
		const paired = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}\\s*>`, "gi");
		const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi");

		if (paired.test(svg) || selfClosing.test(svg)) {
			removed.push(`<${tag}>`);
		}

		svg = svg.replace(paired, "").replace(selfClosing, "");
	}

	svg = svg.replace(DANGEROUS_ATTRIBUTE, (match, name: string, ...groups) => {
		const attribute = name.toLowerCase();
		const value = (groups[1] ?? groups[2] ?? groups[3] ?? "") as string;

		if (attribute.startsWith("on")) {
			removed.push(attribute);
			return "";
		}

		if (URL_ATTRIBUTES.has(attribute) && !isSafeUrl(value)) {
			removed.push(`${attribute}="${value.slice(0, 24)}…"`);
			return "";
		}

		return match;
	});

	if (/javascript\s*:/i.test(svg)) {
		svg = svg.replace(/javascript\s*:/gi, "");
		removed.push("javascript: url");
	}

	return { svg, removed: [...new Set(removed)] };
}
