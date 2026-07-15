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
		return result;
	},
);

export const startInstance = createStart(() => ({
	requestMiddleware: [securityHeadersMiddleware, csrfMiddleware],
}));
