import {
	createCsrfMiddleware,
	createMiddleware,
	createStart,
} from "@tanstack/react-start";

const csrfMiddleware = createCsrfMiddleware({
	filter: (ctx) => ctx.handlerType === "serverFn",
});

const securityHeadersMiddleware = createMiddleware().server(
	async ({ next }) => {
		const result = await next();
		result.response.headers.set("X-Content-Type-Options", "nosniff");
		result.response.headers.set("X-Frame-Options", "DENY");
		result.response.headers.set(
			"Referrer-Policy",
			"strict-origin-when-cross-origin",
		);
		result.response.headers.set(
			"Permissions-Policy",
			"camera=(), microphone=(), geolocation=()",
		);
		result.response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
		// Directives that cannot break script or style loading, but do remove
		// framing, plugin embedding and <base> hijacking outright.
		result.response.headers.set(
			"Content-Security-Policy",
			"frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
		);
		return result;
	},
);

export const startInstance = createStart(() => ({
	requestMiddleware: [securityHeadersMiddleware, csrfMiddleware],
}));
