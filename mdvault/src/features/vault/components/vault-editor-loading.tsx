import { useQueryClient } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { EditorPageLoading } from "#/components/editor-page-loading";
import { vaultConfigQueryOptions } from "#/features/vault/vault.queries";

export function VaultEditorLoading() {
	const queryClient = useQueryClient();
	const { type } = useSearch({ strict: false });
	const config = queryClient.getQueryData(vaultConfigQueryOptions().queryKey);
	const editor = config?.assetTypes.find((item) => item.id === type)?.editor;
	return <EditorPageLoading rich={editor !== "plain"} settings />;
}
