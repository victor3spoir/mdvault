import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "./date";

describe("date formatting", () => {
	it("formats dates with the explicit UTC timezone", () => {
		expect(formatDate("2024-01-02T23:30:00-08:00")).toBe("Jan 3, 2024");
	});

	it("formats date-times with the explicit UTC timezone", () => {
		expect(formatDateTime("2024-01-02T15:04:00Z")).toBe("Jan 2, 2024, 3:04 PM");
	});

	it("accepts Date instances", () => {
		expect(formatDate(new Date("2024-06-15T00:00:00Z"))).toBe("Jun 15, 2024");
	});
});
