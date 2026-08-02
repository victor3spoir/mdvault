import { describe, expect, it } from "vitest";
import { mapWithConcurrency } from "./github-files.server";

describe("mapWithConcurrency", () => {
	it("preserves input order", async () => {
		const results = await mapWithConcurrency([5, 1, 4, 2, 3], 2, async (n) => {
			await new Promise((resolve) => setTimeout(resolve, n));
			return n * 10;
		});

		expect(results).toEqual([50, 10, 40, 20, 30]);
	});

	it("never exceeds the concurrency limit", async () => {
		let active = 0;
		let peak = 0;

		await mapWithConcurrency(Array.from({ length: 25 }), 4, async () => {
			active += 1;
			peak = Math.max(peak, active);
			await new Promise((resolve) => setTimeout(resolve, 1));
			active -= 1;
		});

		expect(peak).toBeLessThanOrEqual(4);
		expect(peak).toBeGreaterThan(1);
	});

	it("handles an empty input", async () => {
		await expect(mapWithConcurrency([], 4, async () => 1)).resolves.toEqual([]);
	});
});
