import { describe, expect, it } from "vitest";
import {
	joinImageSource,
	splitImageSource,
} from "#/features/media/image-display";

describe("splitImageSource", () => {
	it("returns plain source untouched", () => {
		expect(splitImageSource("media/a.png")).toEqual({
			src: "media/a.png",
			attrs: { width: null, align: null },
		});
	});

	it("parses width and align from fragment", () => {
		expect(splitImageSource("media/a.png#w=50&align=left")).toEqual({
			src: "media/a.png",
			attrs: { width: 50, align: "left" },
		});
	});

	it("ignores invalid values", () => {
		expect(splitImageSource("media/a.png#w=33&align=top")).toEqual({
			src: "media/a.png",
			attrs: { width: null, align: null },
		});
	});

	it("handles external urls with fragment", () => {
		expect(splitImageSource("https://x.com/a.png#w=75")).toEqual({
			src: "https://x.com/a.png",
			attrs: { width: 75, align: null },
		});
	});
});

describe("joinImageSource", () => {
	it("omits defaults", () => {
		expect(
			joinImageSource("media/a.png", { width: 100, align: "center" }),
		).toBe("media/a.png");
		expect(joinImageSource("media/a.png", { width: null, align: null })).toBe(
			"media/a.png",
		);
	});

	it("serializes non-default values", () => {
		expect(joinImageSource("media/a.png", { width: 50, align: "left" })).toBe(
			"media/a.png#w=50&align=left",
		);
	});

	it("round-trips", () => {
		const joined = joinImageSource("media/a.png", {
			width: 25,
			align: "right",
		});
		expect(splitImageSource(joined)).toEqual({
			src: "media/a.png",
			attrs: { width: 25, align: "right" },
		});
	});
});
