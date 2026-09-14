import { describe, expect, it } from "vitest";
import { mediaUrl } from "./components/private-image";

describe("mediaUrl", () => {
	it("points a repository path at the proxy", () => {
		expect(mediaUrl("media/a.png")).toBe("/api/media?path=media%2Fa.png");
	});

	it("adds the version so the response can be immutable", () => {
		expect(mediaUrl("media/a.png", { version: "abc123" })).toBe(
			"/api/media?path=media%2Fa.png&v=abc123",
		);
	});

	it("normalises a github blob url to a repository path", () => {
		expect(mediaUrl("https://github.com/o/r/blob/main/media/a.png")).toBe(
			"/api/media?path=media%2Fa.png",
		);
	});

	it("encodes characters that would break the url", () => {
		expect(mediaUrl("media/a b&c.png")).toBe(
			"/api/media?path=media%2Fa+b%26c.png",
		);
	});

	it("keeps nested folders so duplicate filenames remain distinct", () => {
		expect(mediaUrl("media/nested/a.png")).toBe(
			"/api/media?path=media%2Fnested%2Fa.png",
		);
	});

	it("returns an empty string for nothing usable", () => {
		expect(mediaUrl("")).toBe("");
	});

	it("asks for a downscaled variant", () => {
		expect(mediaUrl("media/a.png", { width: 400 })).toBe(
			"/api/media?path=media%2Fa.png&w=400",
		);
	});

	it("combines version and width", () => {
		expect(mediaUrl("media/a.png", { version: "sha", width: 800 })).toBe(
			"/api/media?path=media%2Fa.png&v=sha&w=800",
		);
	});
});

it("preserves external URLs and fixes raw GitHub path normalization", () => {
	expect(mediaUrl("https://example.com/images/a.png")).toBe(
		"https://example.com/images/a.png",
	);
	expect(
		mediaUrl("https://raw.githubusercontent.com/o/r/main/media/folder/a.png"),
	).toBe("/api/media?path=media%2Ffolder%2Fa.png");
	expect(mediaUrl("a.png")).toBe("/api/media?file=a.png");
});
