import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ping")({
	server: {
		handlers: {
			GET: () =>
				new Response("pong", { headers: { "Content-Type": "text/plain" } }),
		},
	},
});
