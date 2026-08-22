const REMOVED_ELEMENTS = [
	"script",
	"style",
	"iframe",
	"object",
	"embed",
	"link",
	"meta",
	"base",
	"svg",
	"math",
	"form",
	"input",
	"button",
	"textarea",
	"select",
];

const ALLOWED_ATTRIBUTES = new Map<string, ReadonlySet<string>>([
	["a", new Set(["href", "title"])],
	["img", new Set(["src", "alt", "title", "width", "height"])],
	["blockquote", new Set(["cite"])],
	["q", new Set(["cite"])],
	["ol", new Set(["start", "reversed"])],
	["li", new Set(["value"])],
	["td", new Set(["colspan", "rowspan"])],
	["th", new Set(["colspan", "rowspan", "scope"])],
	["time", new Set(["datetime"])],
	["details", new Set(["open"])],
]);

const SAFE_HREF_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const SAFE_SRC_PROTOCOLS = new Set(["http:", "https:"]);
const SAFE_DATA_IMAGE = /^data:image\/(?:avif|gif|jpe?g|png|webp);base64,/i;

export function normalizePastedText(value: string): string {
	return value
		.replace(/\u00a0/g, " ")
		.replace(/[\u200b-\u200d\u2060\ufeff]/g, "");
}

function urlProtocol(value: string): string | undefined {
	const probe = value
		.trim()
		// biome-ignore lint/suspicious/noControlCharactersInRegex: URL protocols can be obfuscated with control characters.
		.replace(/[\u0000-\u0020\u007f-\u009f]/g, "")
		.toLowerCase();
	return /^[a-z][a-z0-9+.-]*:/.exec(probe)?.[0];
}

function isSafeUrl(value: string, attribute: "href" | "src"): boolean {
	const trimmed = value.trim();
	if (!trimmed) {
		return false;
	}
	if (
		trimmed.startsWith("#") ||
		trimmed.startsWith("/") ||
		trimmed.startsWith("./") ||
		trimmed.startsWith("../") ||
		trimmed.startsWith("?")
	) {
		return true;
	}
	if (attribute === "src" && SAFE_DATA_IMAGE.test(trimmed)) {
		return true;
	}

	const protocol = urlProtocol(trimmed);
	if (!protocol) {
		return true;
	}
	return (attribute === "href" ? SAFE_HREF_PROTOCOLS : SAFE_SRC_PROTOCOLS).has(
		protocol,
	);
}

function cleanAttributes(element: Element) {
	const tagName = element.tagName.toLowerCase();
	const allowed = ALLOWED_ATTRIBUTES.get(tagName) ?? new Set<string>();

	for (const attribute of Array.from(element.attributes)) {
		const name = attribute.name.toLowerCase();
		if (!allowed.has(name)) {
			element.removeAttribute(attribute.name);
			continue;
		}
		if (
			(name === "href" || name === "src") &&
			!isSafeUrl(attribute.value, name)
		) {
			element.removeAttribute(attribute.name);
		}
	}
}

export function sanitizePastedHtml(html: string): string {
	const document = new DOMParser().parseFromString(html, "text/html");

	for (const selector of REMOVED_ELEMENTS) {
		for (const element of Array.from(
			document.body.querySelectorAll(selector),
		)) {
			element.remove();
		}
	}

	for (const element of Array.from(document.body.querySelectorAll("*"))) {
		cleanAttributes(element);
	}

	const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
	let textNode = walker.nextNode();
	while (textNode) {
		textNode.nodeValue = normalizePastedText(textNode.nodeValue ?? "");
		textNode = walker.nextNode();
	}

	return document.body.innerHTML;
}
