import { type QueryClient, queryOptions } from "@tanstack/react-query";
import {
	getVaultAssetById,
	getVaultAssets,
	getVaultConfig,
} from "#/features/vault/vault.functions";

export const vaultKeys = {
	all: ["vault"] as const,
	config: () => [...vaultKeys.all, "config"] as const,
	lists: () => [...vaultKeys.all, "list"] as const,
	list: (type: string) => [...vaultKeys.lists(), type] as const,
	details: () => [...vaultKeys.all, "detail"] as const,
	detail: (type: string, id: string) =>
		[...vaultKeys.details(), type, id] as const,
};

export const vaultConfigQueryOptions = () =>
	queryOptions({
		queryKey: vaultKeys.config(),
		queryFn: () => getVaultConfig(),
		staleTime: 60_000,
	});

export const vaultAssetsQueryOptions = (type: string) =>
	queryOptions({
		queryKey: vaultKeys.list(type),
		queryFn: () => getVaultAssets({ data: { type } }),
		staleTime: 30_000,
	});

export const vaultAssetQueryOptions = (type: string, id: string) =>
	queryOptions({
		queryKey: vaultKeys.detail(type, id),
		queryFn: () => getVaultAssetById({ data: { type, id } }),
		staleTime: 30_000,
	});

export async function invalidateVaultConfig(queryClient: QueryClient) {
	await queryClient.invalidateQueries({
		queryKey: vaultKeys.config(),
		refetchType: "all",
	});
}
