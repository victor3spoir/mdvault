import { describe, expect, it, vi } from "vitest";
import { isOptimizableType, optimizeImageFile } from "./media.compress";

function fakeFile(name: string, type: string, size: number) {
	const file = new File([new Uint8Array(1)], name, { type });
	Object.defineProperty(file, "size", { value: size });
	return file;
}

describe("isOptimizableType", () => {
	it("accepts the raster formats a canvas can re-encode", () => {
		for (const type of ["image/jpeg", "image/png", "image/webp"]) {
			expect(isOptimizableType(type)).toBe(true);
		}
	});

	it("refuses formats that would be damaged or gain nothing", () => {
		// GIF loses its animation, AVIF is already better than canvas output,
		// SVG has nothing to re-encode.
		for (const type of ["image/gif", "image/avif", "image/svg+xml"]) {
			expect(isOptimizableType(type)).toBe(false);
		}
	});
});

describe("optimizeImageFile", () => {
	it("returns the original when the format is not re-encodable", async () => {
		const gif = fakeFile("anim.gif", "image/gif", 900_000);
		const result = await optimizeImageFile(gif);

		expect(result.optimized).toBe(false);
		expect(result.file).toBe(gif);
		expect(result.before).toBe(result.after);
	});

	it("returns the original outside the browser", async () => {
		// No document/createImageBitmap in this environment.
		const png = fakeFile("shot.png", "image/png", 900_000);
		const result = await optimizeImageFile(png);

		expect(result.optimized).toBe(false);
		expect(result.file).toBe(png);
	});

	it("reports the original size when nothing is done", async () => {
		const jpg = fakeFile("photo.jpg", "image/jpeg", 1_234);
		const result = await optimizeImageFile(jpg);

		expect(result).toMatchObject({ before: 1_234, after: 1_234 });
	});

	it("never throws when the image cannot be decoded", async () => {
		vi.stubGlobal("document", {
			createElement: () => ({ getContext: () => null }),
		});
		vi.stubGlobal("createImageBitmap", () => Promise.reject(new Error("bad")));
		vi.stubGlobal("HTMLCanvasElement", class {});

		const broken = fakeFile("broken.png", "image/png", 5_000);
		await expect(optimizeImageFile(broken)).resolves.toMatchObject({
			optimized: false,
		});

		vi.unstubAllGlobals();
	});
});
