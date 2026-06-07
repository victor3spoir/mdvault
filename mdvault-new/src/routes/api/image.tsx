import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/image")({
	server: {},
});

function RouteComponent() {
	return <div>Hello "/api/image"!</div>;
}
