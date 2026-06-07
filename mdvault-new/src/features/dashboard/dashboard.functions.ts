import { createServerFn } from "@tanstack/react-start";
import {
	getDashboardStats,
	getRecentActivity,
} from "#/features/dashboard/dashboard.server";

export const getDashboardOverview = createServerFn({ method: "GET" }).handler(
	async () => {
		const [stats, activities] = await Promise.all([
			getDashboardStats(),
			getRecentActivity(),
		]);

		return { stats, activities };
	},
);
