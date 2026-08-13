import { describe, expect, it } from "vitest";
import { textToDocument } from "./components/plain-text-editor";

/** Mirrors Tiptap's `getText({ blockSeparator: "\n" })`. */
function documentToText(doc: ReturnType<typeof textToDocument>) {
	return doc.content
		.map((node) => (node.content ?? []).map((child) => child.text).join(""))
		.join("\n");
}

describe("plain text round trip", () => {
	const cases: [string, string][] = [
		["single line", "Bonjour tout le monde"],
		["line break", "Ligne 1\nLigne 2"],
		["blank line between paragraphs", "Paragraphe 1\n\nParagraphe 2"],
		["several blank lines", "A\n\n\nB"],
		["trailing blank line", "A\n"],
		["empty", ""],
		[
			"a real post",
			"Cinq années comme architecte DevSecOps.\n\nJe les partage avec vous.\n\nhttps://github.com/victor3spoir/boilerplates",
		],
	];

	for (const [name, text] of cases) {
		it(`preserves ${name} exactly`, () => {
			expect(documentToText(textToDocument(text))).toBe(text);
		});
	}

	it("creates one paragraph per line", () => {
		expect(textToDocument("a\nb\nc").content).toHaveLength(3);
	});

	it("represents a blank line as an empty paragraph", () => {
		const [, blank] = textToDocument("a\n\nb").content;

		expect(blank).toEqual({ type: "paragraph" });
	});

	it("normalises CRLF so Windows pastes do not double up", () => {
		expect(documentToText(textToDocument("a\r\nb"))).toBe("a\nb");
	});

	it("never turns a single line break into a blank line", () => {
		// The regression: markdown serialisation emitted "\n\n" for every
		// paragraph, so posts could not contain a plain line break.
		expect(documentToText(textToDocument("Ligne 1\nLigne 2"))).not.toContain(
			"\n\n",
		);
	});
});
