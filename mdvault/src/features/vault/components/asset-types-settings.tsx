import {
	IconArrowRight,
	IconEdit,
	IconLoader2,
	IconPlus,
	IconTrash,
} from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	addAssetTypeMutation,
	removeAssetTypeMutation,
	updateAssetTypeMutation,
} from "#/features/vault/vault.functions";
import {
	invalidateVaultConfig,
	vaultConfigQueryOptions,
} from "#/features/vault/vault.queries";
import {
	ASSET_ICONS,
	type AssetEditor,
	type AssetIcon,
	type AssetTypeConfig,
} from "#/features/vault/vault.types";
import {
	ASSET_ICON_COMPONENTS,
	getAssetIcon,
} from "#/features/vault/vault-icons";
import { useConfirm } from "#/hooks/use-confirm";
import { cn } from "#/lib/utils";

function slugify(value: string) {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 30);
}

interface TypeDialogState {
	open: boolean;
	editing: AssetTypeConfig | null;
}

export function AssetTypesSettings() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const { confirm, confirmDialog } = useConfirm();
	const config = useQuery(vaultConfigQueryOptions());
	const [isPending, startTransition] = useTransition();
	const [dialog, setDialog] = useState<TypeDialogState>({
		open: false,
		editing: null,
	});
	const [label, setLabel] = useState("");
	const [typeId, setTypeId] = useState("");
	const [idTouched, setIdTouched] = useState(false);
	const [icon, setIcon] = useState<AssetIcon>("note");
	const [editor, setEditor] = useState<AssetEditor>("rich");

	const types = config.data?.assetTypes ?? [];
	const isEditing = dialog.editing !== null;

	function openCreate() {
		setLabel("");
		setTypeId("");
		setIdTouched(false);
		setIcon("note");
		setEditor("rich");
		setDialog({ open: true, editing: null });
	}

	function openEdit(type: AssetTypeConfig) {
		setLabel(type.label);
		setTypeId(type.id);
		setIcon(type.icon);
		setEditor(type.editor);
		setDialog({ open: true, editing: type });
	}

	function closeDialog() {
		setDialog({ open: false, editing: null });
	}

	function handleSubmit() {
		startTransition(async () => {
			try {
				if (isEditing && dialog.editing) {
					await updateAssetTypeMutation({
						data: {
							id: dialog.editing.id,
							updates: { label, icon, editor },
						},
					});
					toast.success(`Asset type "${label}" updated`);
				} else {
					await addAssetTypeMutation({
						data: { id: typeId, label, icon, editor },
					});
					toast.success(`Asset type "${label}" created`);
				}
				await invalidateVaultConfig(queryClient);
				router.invalidate();
				closeDialog();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to save asset type",
				);
			}
		});
	}

	async function handleRemove(type: AssetTypeConfig) {
		const confirmed = await confirm({
			title: `Remove "${type.label}"?`,
			description: `Existing files in vault/${type.id}/ are kept in the repository, but this type will no longer appear in MDVault.`,
			confirmLabel: "Remove type",
		});

		if (!confirmed) {
			return;
		}

		startTransition(async () => {
			try {
				await removeAssetTypeMutation({ data: { id: type.id } });
				toast.success(`Asset type "${type.label}" removed`);
				await invalidateVaultConfig(queryClient);
				router.invalidate();
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: "Failed to remove asset type",
				);
			}
		});
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-lg font-semibold">Asset Types</h2>
					<p className="text-sm text-muted-foreground">
						Define custom content types stored under{" "}
						<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
							vault/
						</code>{" "}
						in your repository. Each type gets its own folder and sidebar link.
					</p>
				</div>
			</div>

			{config.isLoading ? (
				<div className="flex items-center gap-2 rounded-xl border bg-card p-6 text-sm text-muted-foreground">
					<IconLoader2 className="size-4 animate-spin" />
					Loading configuration...
				</div>
			) : (
				<div className="grid grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-4">
					{types.map((type) => {
						const Icon = getAssetIcon(type.icon);
						return (
							<div
								key={type.id}
								className="group relative flex flex-col gap-4 rounded-2xl border bg-card p-5 transition-[border-color,box-shadow] duration-200 ease-out hover:border-primary/40 hover:shadow-md"
							>
								<div className="flex items-start justify-between">
									<span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
										<Icon className="size-5" />
									</span>
									<div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
										<Button
											variant="ghost"
											size="icon"
											className="size-8 rounded-lg"
											aria-label={`Edit ${type.label}`}
											onClick={() => openEdit(type)}
										>
											<IconEdit className="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="size-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
											aria-label={`Remove ${type.label}`}
											disabled={isPending}
											onClick={() => handleRemove(type)}
										>
											<IconTrash className="size-4" />
										</Button>
									</div>
								</div>

								<div className="min-w-0">
									<h3 className="truncate font-semibold tracking-tight">
										{type.label}
									</h3>
									<p className="truncate font-mono text-xs text-muted-foreground">
										vault/{type.id}/
									</p>
								</div>

								<div className="mt-auto flex items-center justify-between border-t pt-3">
									<Badge
										variant="secondary"
										className="rounded-full text-[10px] uppercase"
									>
										{type.editor === "rich" ? "Rich editor" : "Plain text"}
									</Badge>
									<Link
										to="/cms/vault"
										search={{ type: type.id, searchQuery: "" }}
										className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
									>
										Open
										<IconArrowRight className="size-3" />
									</Link>
								</div>
							</div>
						);
					})}

					<button
						type="button"
						onClick={openCreate}
						className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-muted-foreground/20 p-5 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
					>
						<span className="flex size-11 items-center justify-center rounded-xl bg-muted">
							<IconPlus className="size-5" />
						</span>
						<span className="text-sm font-medium">Add asset type</span>
						<span className="text-xs text-muted-foreground">
							Notes, docs, tutorials...
						</span>
					</button>
				</div>
			)}

			<Dialog
				open={dialog.open}
				onOpenChange={(open) => (open ? undefined : closeDialog())}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{isEditing ? "Edit Asset Type" : "New Asset Type"}
						</DialogTitle>
						<DialogDescription>
							{isEditing
								? "Update how this asset type appears and which editor it uses."
								: "A folder vault/<id>/ will be created in your repository."}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="asset-type-label">Label</Label>
							<Input
								id="asset-type-label"
								value={label}
								onChange={(event) => {
									setLabel(event.target.value);
									if (!isEditing && !idTouched) {
										setTypeId(slugify(event.target.value));
									}
								}}
								placeholder="Notes"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="asset-type-id">
								Id{" "}
								<span className="font-normal text-muted-foreground">
									(folder name{isEditing ? ", immutable" : ""})
								</span>
							</Label>
							<Input
								id="asset-type-id"
								value={typeId}
								disabled={isEditing}
								onChange={(event) => {
									setIdTouched(true);
									setTypeId(slugify(event.target.value));
								}}
								placeholder="notes"
								className="font-mono text-sm"
							/>
						</div>

						<div className="space-y-2">
							<Label>Icon</Label>
							<div className="grid grid-cols-6 gap-2">
								{ASSET_ICONS.map((option) => {
									const Icon = ASSET_ICON_COMPONENTS[option];
									return (
										<button
											key={option}
											type="button"
											aria-label={`Icon ${option}`}
											aria-pressed={icon === option}
											onClick={() => setIcon(option)}
											className={cn(
												"flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
												icon === option &&
													"border-primary bg-primary/10 text-primary",
											)}
										>
											<Icon className="size-4" />
										</button>
									);
								})}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="asset-type-editor">Editor</Label>
							<Select
								value={editor}
								onValueChange={(value) => setEditor(value as AssetEditor)}
							>
								<SelectTrigger id="asset-type-editor" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="rich">
										Rich editor (headings, images, code...)
									</SelectItem>
									<SelectItem value="plain">Plain text only</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-[11px] text-muted-foreground">
								Can be changed later without affecting stored content.
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={closeDialog}>
							Cancel
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={isPending || !label.trim() || typeId.length < 2}
							className="gap-2"
						>
							{isPending ? (
								<IconLoader2 className="size-4 animate-spin" />
							) : null}
							{isEditing ? "Save Changes" : "Create Type"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			{confirmDialog}
		</div>
	);
}
