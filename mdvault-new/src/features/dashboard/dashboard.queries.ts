import { queryOptions } from "@tanstack/react-query";
import { getDashboardOverview } from "#/features/dashboard/dashboard.functions";

export const dashboardOverviewQueryOptions = () =>
	queryOptions({
		queryKey: ["dashboard", "overview"],
		queryFn: () => getDashboardOverview(),
		staleTime: 30_000,
	});
