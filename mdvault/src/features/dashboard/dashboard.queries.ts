import { queryOptions } from "@tanstack/react-query";
import { getDashboardOverview } from "#/features/dashboard/dashboard.functions";

export const dashboardKeys = {
	all: ["dashboard"] as const,
	overview: () => [...dashboardKeys.all, "overview"] as const,
};

export const dashboardOverviewQueryOptions = () =>
	queryOptions({
		queryKey: dashboardKeys.overview(),
		queryFn: () => getDashboardOverview(),
		staleTime: 30_000,
	});
