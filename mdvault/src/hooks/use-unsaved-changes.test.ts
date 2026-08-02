import { describe, expect, it, vi } from "vitest";
import { shouldBlockUnsavedNavigation } from "./use-unsaved-changes";

describe("unsaved navigation", () => {
	it("does not prompt for a clean form", () => {
		const confirmLeave = vi.fn();

		expect(shouldBlockUnsavedNavigation(false, false, confirmLeave)).toBe(
			false,
		);
		expect(confirmLeave).not.toHaveBeenCalled();
	});

	it("allows intentional navigation after a successful mutation", () => {
		const confirmLeave = vi.fn();

		expect(shouldBlockUnsavedNavigation(true, true, confirmLeave)).toBe(false);
		expect(confirmLeave).not.toHaveBeenCalled();
	});

	it("blocks when the user keeps editing", () => {
		expect(shouldBlockUnsavedNavigation(true, false, () => false)).toBe(true);
	});

	it("continues when the user confirms leaving", () => {
		expect(shouldBlockUnsavedNavigation(true, false, () => true)).toBe(false);
	});
});
