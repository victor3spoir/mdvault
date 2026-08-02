import { describe, expect, it } from "vitest";
import { isTrustedOrigin } from "./security-middleware";

function request(headers: Record<string, string>) {
	return new Request("http://localhost:3000/_serverFn/x", {
		method: "POST",
		headers,
	});
}

describe("write origin checks", () => {
	it("accepts a same-origin browser write", () => {
		expect(
			isTrustedOrigin(
				request({
					origin: "http://localhost:3000",
					"sec-fetch-site": "same-origin",
				}),
			),
		).toBe(true);
	});

	it("rejects a cross-site write even when the origin looks right", () => {
		expect(
			isTrustedOrigin(
				request({
					origin: "http://localhost:3000",
					"sec-fetch-site": "cross-site",
				}),
			),
		).toBe(false);
	});

	it("rejects a mismatched origin", () => {
		expect(isTrustedOrigin(request({ origin: "http://evil.test" }))).toBe(
			false,
		);
	});

	it("rejects an opaque origin", () => {
		expect(isTrustedOrigin(request({ origin: "null" }))).toBe(false);
	});

	it("accepts the configured public origin", () => {
		expect(
			isTrustedOrigin(
				request({ origin: "https://mdvault.example" }),
				"https://mdvault.example",
			),
		).toBe(true);
	});

	it("allows server-initiated calls that carry no browser headers", () => {
		expect(isTrustedOrigin(request({}))).toBe(true);
	});
});
