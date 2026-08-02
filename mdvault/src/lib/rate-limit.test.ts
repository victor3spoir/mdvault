import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

function limiter(maxEntries = 100) {
	return createRateLimiter({ windowMs: 1000, maxEntries });
}

describe("rate limiter", () => {
	it("allows requests up to the limit and rejects the next one", () => {
		const rl = limiter();

		expect(rl.consume("a", 3, 0)).toBe(true);
		expect(rl.consume("a", 3, 0)).toBe(true);
		expect(rl.consume("a", 3, 0)).toBe(true);
		expect(rl.consume("a", 3, 0)).toBe(false);
	});

	it("counts each key separately", () => {
		const rl = limiter();

		expect(rl.consume("a", 1, 0)).toBe(true);
		expect(rl.consume("b", 1, 0)).toBe(true);
		expect(rl.consume("a", 1, 0)).toBe(false);
	});

	it("starts a fresh window once the previous one expires", () => {
		const rl = limiter();

		expect(rl.consume("a", 1, 0)).toBe(true);
		expect(rl.consume("a", 1, 500)).toBe(false);
		expect(rl.consume("a", 1, 1001)).toBe(true);
	});

	it("reclaims expired keys instead of growing without bound", () => {
		const rl = limiter(10);

		for (let index = 0; index < 10; index++) {
			expect(rl.consume(`key-${index}`, 5, 0)).toBe(true);
		}
		expect(rl.size()).toBe(10);

		// A new key while the map is full and every entry is still live.
		expect(rl.consume("overflow", 5, 0)).toBe(false);

		// Once the window has passed the expired keys are swept and reused.
		expect(rl.consume("overflow", 5, 2000)).toBe(true);
		expect(rl.size()).toBe(1);
	});

	it("does not grow when the same key keeps hitting", () => {
		const rl = limiter();

		for (let index = 0; index < 50; index++) {
			rl.consume("same", 1000, 0);
		}

		expect(rl.size()).toBe(1);
	});
});
