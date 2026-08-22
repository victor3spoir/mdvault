import { describe, expect, it } from "vitest";
import { parseMediaEmbed } from "#/features/content/media-embed";

describe("media embed URLs", () => {
	it("uses the privacy-enhanced YouTube player", () => {
		const media = parseMediaEmbed("https://youtu.be/dQw4w9WgXcQ");
		expect(media).toMatchObject({
			provider: "youtube",
			id: "dQw4w9WgXcQ",
			embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
		});
	});

	it("accepts Vimeo URLs and rejects arbitrary hosts", () => {
		expect(parseMediaEmbed("https://vimeo.com/123456789")).toMatchObject({
			provider: "vimeo",
			id: "123456789",
		});
		expect(parseMediaEmbed("https://example.com/video/123456789")).toBeNull();
	});

	it("preserves Vimeo unlisted-video privacy hashes", () => {
		expect(
			parseMediaEmbed("https://vimeo.com/123456789/abcdef1234"),
		).toMatchObject({
			embedUrl: "https://player.vimeo.com/video/123456789?h=abcdef1234",
		});
	});
});
