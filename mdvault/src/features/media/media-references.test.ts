import { describe, expect, it } from "vitest";
import { resolveMediaFolder, resolveMediaPath } from "./media-path";
import {
	collectMediaReferences,
	replaceMediaReferences,
	verifyMediaReferences,
} from "./media-references";

const context = {
	mediaRoot: "media",
	owner: "owner",
	repo: "repo",
	branch: "main",
};
const documentPath = "articles/example.md";
const scan = (raw: string) =>
	collectMediaReferences(raw, documentPath, context);

describe("media references", () => {
	it("handles unquoted frontmatter paths with spaces", () => {
		const raw = "coverImage: media/my folder/a.png";
		expect(scan(raw).map((item) => item.path)).toContain(
			"media/my folder/a.png",
		);
	});
	it("blocks ambiguous semantic references instead of marking media unused", () => {
		expect(() =>
			verifyMediaReferences(
				"",
				{ coverImage: "media/a.png" },
				[],
				documentPath,
				context,
			),
		).toThrow("Cannot safely scan");
		expect(() =>
			verifyMediaReferences("![a](media/a.png)", {}, [], documentPath, context),
		).toThrow("Cannot safely scan");
	});
	it.each([
		["![Alt](media/a.png)", "media/a.png"],
		["![Alt](media/a.png#w=50&align=left)", "media/a.png"],
		['[image]: ../media/a.png "caption"', "media/a.png"],
		["coverImage: media/a.png", "media/a.png"],
		["coverImage: 'media/a b.png'", "media/a b.png"],
		["![Alt](<media/a b.png>)", "media/a b.png"],
		["![Alt](media/a%20b.png)", "media/a b.png"],
		["![Alt](media/a(b).png)", "media/a(b).png"],
		['<img src="media/a.png" />', "media/a.png"],
		[
			"https://raw.githubusercontent.com/owner/repo/main/media/a.png",
			"media/a.png",
		],
		[
			"https://raw.githubusercontent.com/owner/repo/refs/heads/main/media/a.png",
			"media/a.png",
		],
		["https://github.com/owner/repo/blob/main/media/a.png", "media/a.png"],
		["![a](/api/media?path=media%2Fa.png&w=400)", "media/a.png"],
		["![a](/api/media?file=a.png)", "media/a.png"],
		["![a](/api/image?path=media%2Fa.png)", "media/a.png"],
		["A plain post\n/media/a.png", "media/a.png"],
		["```md\n![example](media/a.png)\n```", "media/a.png"],
	])("finds %s", (raw, path) => {
		expect(scan(raw).map((reference) => reference.path)).toContain(path);
	});
	it.each([
		"https://example.com/media/a.png",
		"https://github.com/other/repo/blob/main/media/a.png",
		"https://raw.githubusercontent.com/owner/repo/other/media/a.png",
		"data:image/png;base64,abc",
		"media/../../a.png",
		"media/a.png.other",
	])("ignores unrelated or invalid source %s", (raw) => {
		expect(scan(raw)).toEqual([]);
	});
	it("uses the configured media root and nested Vault-relative paths", () => {
		expect(
			collectMediaReferences(
				"![a](../../assets/images/a.svg)",
				"vault/docs/a.md",
				{ ...context, mediaRoot: "assets/images" },
			)[0]?.path,
		).toBe("assets/images/a.svg");
	});
	it("preserves syntax, frontmatter, CRLF and display metadata when moving", () => {
		const raw =
			"---\r\ntitle: A\r\ncoverImage: 'media/a.png'\r\n---\r\n![Alt](../media/a.png#w=50&align=left \"Caption\")\r\n![Other](media/a.png.other)";
		expect(
			replaceMediaReferences(
				raw,
				scan(raw),
				new Map([["media/a.png", "media/new folder/a.png"]]),
			),
		).toBe(
			raw
				.replace("'media/a.png'", "'media/new%20folder/a.png'")
				.replace(
					"../media/a.png#w=50&align=left",
					"../media/new%20folder/a.png#w=50&align=left",
				),
		);
	});
	it("preserves absolute GitHub URL styles and proxy options", () => {
		const raw =
			"https://github.com/owner/repo/blob/main/media/a.png\n/api/media?file=a.png&w=400";
		expect(
			replaceMediaReferences(
				raw,
				scan(raw),
				new Map([["media/a.png", "media/new/a.png"]]),
			),
		).toBe(
			"https://github.com/owner/repo/blob/main/media/new/a.png\n/api/media?w=400&path=media%2Fnew%2Fa.png",
		);
	});
});

describe("media paths", () => {
	it("supports nested paths and custom roots", () => {
		expect(
			resolveMediaPath("assets/images/folder/a.png", "assets/images"),
		).toBe("assets/images/folder/a.png");
	});
	it.each([
		"../secret.png",
		"media/../../secret.png",
		"other/a.png",
		"media/%2e%2e/secret.png",
		"media/a.txt",
	])("rejects %s", (path) =>
		expect(resolveMediaPath(path, "media")).toBeNull());
	it("creates relative folders and supports root moves", () => {
		expect(resolveMediaFolder("posts/été 2026", "media")).toBe(
			"media/posts/été 2026",
		);
		expect(resolveMediaFolder("", "media")).toBe("media");
	});
	it.each([
		"../other",
		"/etc",
		"foo//bar",
		"foo\\bar",
		"%2e%2e",
	])("rejects folder %s", (folder) =>
		expect(() => resolveMediaFolder(folder, "media")).toThrow());
});
