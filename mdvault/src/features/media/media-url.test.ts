import { describe, expect, it } from "vitest";
import { mediaUrl } from "./components/private-image";

describe("mediaUrl", () => {
	it("points a repository path at the proxy", () => {
		expect(mediaUrl("media/a.png")).toBe("/api/media?file=a.png");
	});

	it("adds the version so the response can be immutable", () => {
		expect(mediaUrl("media/a.png", { version: "abc123" })).toBe(
			"/api/media?file=a.png&v=abc123",
		);
	});

	it("normalises a github blob url to a repository path", () => {
		expect(mediaUrl("https://github.com/o/r/blob/main/media/a.png")).toBe(
			"/api/media?file=a.png",
		);
	});

	it("encodes characters that would break the url", () => {
		expect(mediaUrl("media/a b&c.png")).toBe("/api/media?file=a+b%26c.png");
	});

	it("uses only the filename, so the media directory can be renamed", () => {
		expect(mediaUrl("media/nested/a.png")).toBe("/api/media?file=a.png");
	});

	it("returns an empty string for nothing usable", () => {
		expect(mediaUrl("")).toBe("");
	});

	it("asks for a downscaled variant", () => {
		expect(mediaUrl("media/a.png", { width: 400 })).toBe(
			"/api/media?file=a.png&w=400",
		);
	});

	it("combines version and width", () => {
		expect(mediaUrl("media/a.png", { version: "sha", width: 800 })).toBe(
			"/api/media?file=a.png&v=sha&w=800",
		);
	});
});
