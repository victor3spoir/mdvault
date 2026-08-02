import { createServerFn } from "@tanstack/react-start";
import { loadDashboardOverview } from "#/features/dashboard/dashboard.server";
import { securityMiddleware } from "#/lib/security-middleware";

export const getDashboardOverview = createServerFn({ method: "GET" })
	.middleware([securityMiddleware])
	.handler(() => loadDashboardOverview());
