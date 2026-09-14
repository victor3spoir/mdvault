import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useCallback } from "react";

export function useMediaRefresh() {
	const client = useQueryClient();
	const router = useRouter();
	return useCallback(async () => {
		await Promise.all(
			["media", "articles", "posts", "vault", "dashboard"].map((scope) =>
				client.invalidateQueries({ queryKey: [scope], refetchType: "all" }),
			),
		);
		await router.invalidate({ sync: true });
	}, [client, router]);
}
