import {
	IconArrowLeft,
	IconCheck,
	IconCloud,
	IconCloudOff,
	IconDeviceFloppy,
	IconEye,
	IconFileText,
	IconLanguage,
	IconLoader2,
	IconMarkdown,
	IconPhoto,
	IconPlus,
	IconSettings,
	IconTag,
	IconTrash,
	IconWorld,
	IconWorldOff,
	IconWorldUpload,
	IconX,
} from "@tabler/icons-react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
	type ReactNode,
	useCallback,
	useRef,
	useState,
	useTransition,
} from "react";
import { toast } from "sonner";
import { EditorTitleInput } from "#/components/editor-title-input";
import { LocaleFlag } from "#/components/locale-flag";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Separator } from "#/components/ui/separator";
import { Textarea } from "#/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { getContentStats } from "#/features/articles/articles.utils";
import {
	RichTextEditor,
	type RichTextEditorHandle,
} from "#/features/articles/components/editor/rich-text-editor";
import { MarkdownContent } from "#/features/content/components/markdown-content";
import { CoverImageSelector } from "#/features/media/components/cover-image-selector";
import { ImageInsertDialog } from "#/features/media/components/image-insert-dialog";
import { compressImage } from "#/features/media/media.compress";
import { uploadImageMutation } from "#/features/media/media.functions";
import type { MediaFile } from "#/features/media/media.types";
import {
	PlainTextEditor,
	type PlainTextEditorHandle,
} from "#/features/posts/components/plain-text-editor";
import type { ContentRevision } from "#/features/shared/content-revision";
import {
	getLocaleLabel,
	includeCurrentLocale,
} from "#/features/shared/locales";
import { useContentRefresh } from "#/features/shared/use-content-refresh";
import { VaultTranslationsSection } from "#/features/vault/components/vault-translations-section";
import {
	createVaultAssetMutation,
	deleteVaultAssetMutation,
	setVaultAssetPublishedMutation,
	updateVaultAssetMutation,
} from "#/features/vault/vault.functions";
import type { AssetTypeConfig, VaultAsset } from "#/features/vault/vault.types";
import { useConfirm } from "#/hooks/use-confirm";
import { useUnsavedChanges } from "#/hooks/use-unsaved-changes";
import { cn } from "#/lib/utils";

interface VaultEditorProps {
	typeConfig: AssetTypeConfig;
	asset?: VaultAsset | null;
	locales: readonly string[];
	defaultLocale: string;
}

interface SettingsSectionProps {
	icon: ReactNode;
	title: string;
	htmlFor?: string;
	children: ReactNode;
}

function SettingsSection({
	icon,
	title,
	htmlFor,
	children,
}: SettingsSectionProps) {
	return (
		<section className="group border-b px-4 py-5 transition-colors last:border-b-0 hover:bg-muted/40">
			<div className="mb-3 flex items-center justify-between gap-2">
				<Label
					htmlFor={htmlFor}
					className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors group-hover:text-foreground"
				>
					<span className="flex size-6 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-xs transition-colors group-hover:text-primary">
						{icon}
					</span>
					{title}
				</Label>
			</div>
			{children}
		</section>
	);
}

export function VaultEditor({
	typeConfig,
	asset,
	locales,
	defaultLocale,
}: VaultEditorProps) {
	const navigate = useNavigate();
	const refreshContent = useContentRefresh("vault");
	const richRef = useRef<RichTextEditorHandle>(null);
	const plainRef = useRef<PlainTextEditorHandle>(null);
	const [isPending, startTransition] = useTransition();
	const [title, setTitle] = useState(asset?.title ?? "");
	const [description, setDescription] = useState(asset?.description ?? "");
	const [lang, setLang] = useState(asset?.lang ?? defaultLocale);
	const localeOptions = includeCurrentLocale(locales, asset?.lang);
	const [tags, setTags] = useState<string[]>(asset?.tags ?? []);
	const [tagInput, setTagInput] = useState("");
	const [coverImage, setCoverImage] = useState(asset?.coverImage ?? "");
	const [published, setPublished] = useState(asset?.published ?? false);
	const [content, setContent] = useState(asset?.content ?? "");
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [previewMode, setPreviewMode] = useState(false);
	const [sourceMode, setSourceMode] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [revision, setRevision] = useState<ContentRevision | null>(
		asset ? { path: asset.path, sha: asset.sha } : null,
	);
	const allowNavigation = useUnsavedChanges(hasUnsavedChanges);
	const { confirm, confirmDialog } = useConfirm();

	const mode = asset ? "edit" : "create";
	const isRich = typeConfig.editor === "rich";
	const stats = getContentStats(content);
	const router = useRouter();
	const [imageInsertDialogOpen, setImageInsertDialogOpen] = useState(false);

	const markDirty = () => setHasUnsavedChanges(true);

	const handleTogglePreview = () => {
		setPreviewMode((value) => {
			const next = !value;
			if (next) {
				setSidebarCollapsed(true);
			}
			return next;
		});
	};

	const handleImageUpload = useCallback(
		async (file: File) => {
			const prepared = await compressImage(file);
			const buffer = await prepared.arrayBuffer();
			let binary = "";
			for (const byte of new Uint8Array(buffer)) {
				binary += String.fromCharCode(byte);
			}
			const uploaded = await uploadImageMutation({
				data: {
					fileName: prepared.name,
					mimeType: prepared.type,
					base64: btoa(binary),
				},
			});
			router.invalidate();
			return uploaded.url;
		},
		[router],
	);

	const handleImageInsert = (image: MediaFile) => {
		const alt =
			image.name
				.trim()
				.replace(/\.[^.]+$/, "")
				.replace(/[-_]+/g, " ")
				.replace(/[[\]\r\n]/g, " ") || "Image";
		richRef.current?.insertMarkdown(`![${alt}](${image.url})`);
		setImageInsertDialogOpen(false);
		markDirty();
	};

	const getMarkdown = () => {
		if (isRich) {
			return sourceMode ? content : (richRef.current?.getMarkdown() ?? "");
		}

		return plainRef.current?.getMarkdown() ?? "";
	};

	const handleToggleSource = () => {
		if (!isRich) return;

		if (sourceMode) {
			richRef.current?.setMarkdown(content, false);
		} else {
			setContent(richRef.current?.getMarkdown() ?? content);
		}

		setSourceMode((value) => !value);
	};

	function commitTag() {
		const next = tagInput.trim().toLowerCase();
		if (next && !tags.includes(next)) {
			setTags([...tags, next]);
			markDirty();
		}
		setTagInput("");
	}

	const handleSave = () => {
		const markdown = getMarkdown();
		if (!markdown.trim()) {
			toast.warning("Write some content before saving");
			return;
		}

		startTransition(async () => {
			try {
				const input = {
					title,
					description: description.trim() || undefined,
					content: markdown,
					lang,
					tags,
					coverImage: coverImage.trim() || undefined,
					author: asset?.author,
					published,
				};

				if (mode === "create") {
					const id = await createVaultAssetMutation({
						data: { ...input, type: typeConfig.id },
					});
					setHasUnsavedChanges(false);
					await refreshContent();
					allowNavigation();
					await navigate({
						to: "/cms/vault/$id/edit",
						params: { id },
						search: { type: typeConfig.id },
					});
				} else if (asset && revision) {
					const next = await updateVaultAssetMutation({
						data: { type: typeConfig.id, id: asset.id, input, revision },
					});
					setRevision(next);
					setHasUnsavedChanges(false);
					await refreshContent();
				}

				toast.success("Saved");
			} catch (error) {
				toast.error(error instanceof Error ? error.message : "Failed to save");
			}
		});
	};

	const handleTogglePublish = () => {
		if (!asset || !revision) return;
		startTransition(async () => {
			try {
				const next = await setVaultAssetPublishedMutation({
					data: {
						type: typeConfig.id,
						id: asset.id,
						published: !published,
						revision,
					},
				});
				setRevision(next);
				setPublished(!published);
				await refreshContent();
				toast.success(published ? "Unpublished" : "Published");
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to change status",
				);
			}
		});
	};

	const handleDelete = async () => {
		const current = asset;
		if (!current || !revision) {
			return;
		}

		const confirmed = await confirm({
			title: `Delete "${current.title}"?`,
			description:
				"This removes the file from your repository. The change is committed and can still be recovered from git history.",
		});

		if (!confirmed) {
			return;
		}
		startTransition(async () => {
			try {
				await deleteVaultAssetMutation({
					data: { type: typeConfig.id, id: current.id, revision },
				});
				await refreshContent();
				toast.success("Deleted");
				allowNavigation();
				await navigate({
					to: "/cms/vault",
					search: { type: typeConfig.id, searchQuery: "" },
				});
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to delete",
				);
			}
		});
	};

	return (
		<div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-background">
			<header className="flex h-12 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
				<div className="flex items-center gap-3">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="size-8 rounded-lg"
								aria-label={`Back to ${typeConfig.label}`}
								asChild
							>
								<Link
									to="/cms/vault"
									search={{ type: typeConfig.id, searchQuery: "" }}
								>
									<IconArrowLeft className="size-4" />
								</Link>
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							Back to {typeConfig.label}
						</TooltipContent>
					</Tooltip>

					<Separator orientation="vertical" className="h-5" />

					<div className="flex items-center gap-2">
						<Badge
							variant="secondary"
							className={
								published
									? "h-5 gap-1 rounded-full bg-emerald-500/10 px-2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
									: "h-5 gap-1 rounded-full bg-amber-500/10 px-2 text-[10px] font-medium text-amber-600 dark:text-amber-400"
							}
						>
							{published ? (
								<>
									<IconCheck className="size-3" />
									Published
								</>
							) : (
								<>
									<IconFileText className="size-3" />
									Draft
								</>
							)}
						</Badge>

						{hasUnsavedChanges ? (
							<span className="flex items-center gap-1 text-xs text-muted-foreground">
								<IconCloudOff className="size-3" />
								Unsaved
							</span>
						) : mode === "edit" ? (
							<span className="flex items-center gap-1 text-xs text-muted-foreground">
								<IconCloud className="size-3" />
								Saved
							</span>
						) : null}
					</div>
				</div>

				<div className="flex items-center gap-1.5">
					{isRich ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant={sourceMode ? "secondary" : "ghost"}
									size="icon"
									className="size-8 rounded-lg"
									aria-label="Toggle markdown source"
									aria-pressed={sourceMode}
									onClick={handleToggleSource}
								>
									<IconMarkdown className="size-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{sourceMode ? "Back to the editor" : "Markdown source"}
							</TooltipContent>
						</Tooltip>
					) : null}

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="size-8 rounded-lg"
								aria-label="Save"
								onClick={handleSave}
								disabled={isPending || !title.trim()}
							>
								{isPending ? (
									<IconLoader2 className="size-4 animate-spin" />
								) : (
									<IconDeviceFloppy className="size-4" />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{isPending ? "Saving..." : "Save"}
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant={previewMode ? "secondary" : "ghost"}
								size="icon"
								className="size-8 rounded-lg"
								aria-label="Toggle live preview"
								aria-pressed={previewMode}
								onClick={handleTogglePreview}
							>
								<IconEye className="size-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{previewMode ? "Close live preview" : "Live preview"}
						</TooltipContent>
					</Tooltip>

					{mode === "edit" && asset ? (
						<>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="size-8 rounded-lg"
										aria-label={published ? "Unpublish" : "Publish"}
										onClick={handleTogglePublish}
									>
										{published ? (
											<IconWorldOff className="size-4" />
										) : (
											<IconWorldUpload className="size-4" />
										)}
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									{published ? "Unpublish" : "Publish"}
								</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="size-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
										aria-label="Delete"
										onClick={handleDelete}
									>
										<IconTrash className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">Delete</TooltipContent>
							</Tooltip>
						</>
					) : null}

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant={sidebarCollapsed ? "secondary" : "ghost"}
								size="icon"
								className="size-8 rounded-lg"
								aria-label={
									sidebarCollapsed ? "Open settings" : "Close settings"
								}
								aria-controls="vault-settings-sidebar"
								aria-expanded={!sidebarCollapsed}
								onClick={() => setSidebarCollapsed((value) => !value)}
							>
								<IconSettings className="size-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{sidebarCollapsed ? "Settings" : "Close settings"}
						</TooltipContent>
					</Tooltip>
				</div>
			</header>

			{/*
			 * A container, not the viewport: the CMS sidebar can be open or closed, so
			 * the workspace is narrower than the window by an amount media queries
			 * cannot see. The split is decided by the space actually available.
			 */}
			<div className="@container/workspace flex flex-1 overflow-hidden">
				<div
					className={cn(
						"flex-col overflow-hidden",
						previewMode
							? "hidden @3xl/workspace:flex @3xl/workspace:w-1/2"
							: "flex flex-1",
					)}
				>
					<div className="shrink-0 border-b bg-linear-to-b from-muted/30 to-transparent px-8 py-3">
						<EditorTitleInput
							value={title}
							placeholder={`${typeConfig.label.replace(/s$/i, "")} title...`}
							ariaLabel="Title"
							onChange={(value) => {
								setTitle(value);
								markDirty();
							}}
						/>
						<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
							<span>{stats.wordCount} words</span>
							<span>•</span>
							<span>{isRich ? "Rich editor" : "Plain text"}</span>
						</div>
					</div>

					<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
						{isRich ? (
							<>
								<div
									className={cn("flex min-h-0 flex-1", sourceMode && "hidden")}
								>
									<RichTextEditor
										ref={richRef}
										markdown={asset?.content ?? ""}
										onImageUpload={handleImageUpload}
										onImageInsertClick={() => setImageInsertDialogOpen(true)}
										onChange={(value) => {
											setContent(value);
											markDirty();
										}}
									/>
								</div>

								{sourceMode ? (
									<textarea
										value={content}
										aria-label="Markdown source"
										spellCheck={false}
										onChange={(event) => {
											setContent(event.target.value);
											markDirty();
										}}
										className="min-h-0 flex-1 resize-none bg-transparent px-8 py-6 font-mono text-sm leading-7 outline-none"
									/>
								) : null}
							</>
						) : (
							<PlainTextEditor
								ref={plainRef}
								markdown={asset?.content ?? ""}
								placeholder={`Write your ${typeConfig.label.toLowerCase()}...`}
								onChange={(value) => {
									setContent(value);
									markDirty();
								}}
							/>
						)}
					</div>
				</div>

				{previewMode ? (
					<div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-l bg-background @3xl/workspace:w-1/2">
						<div className="sticky top-0 z-10 flex shrink-0 items-center border-b bg-background/95 px-8 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
							Live Preview
						</div>
						<article className="mx-auto w-full max-w-[70ch] px-8 py-8">
							{title ? (
								<h1 className="mb-6 text-4xl font-bold tracking-tight">
									{title}
								</h1>
							) : null}
							{content.trim() ? (
								<MarkdownContent source={content} />
							) : (
								<p className="text-sm text-muted-foreground">
									Nothing to preview yet. Start writing to see it here.
								</p>
							)}
						</article>
					</div>
				) : null}

				<aside
					id="vault-settings-sidebar"
					aria-label="Asset settings"
					className={cn(
						"shrink-0 border-l bg-muted/20 transition-[width,opacity] duration-200 ease-out",
						sidebarCollapsed ? "w-0 overflow-hidden" : "w-80",
					)}
				>
					<div className="flex h-full w-80 flex-col overflow-hidden">
						<div className="flex h-12 shrink-0 items-center justify-between border-b bg-background/60 px-4 backdrop-blur-sm">
							<h3 className="text-sm font-semibold">
								{typeConfig.label} Settings
							</h3>
						</div>

						<div className="flex-1 overflow-y-auto">
							<SettingsSection
								icon={<IconLanguage className="size-3.5" />}
								title="Language"
								htmlFor="vault-language"
							>
								<Select
									value={lang}
									onValueChange={(value) => {
										setLang(value);
										markDirty();
									}}
								>
									<SelectTrigger id="vault-language" className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{localeOptions.map((locale) => (
												<SelectItem key={locale} value={locale}>
													<LocaleFlag locale={locale} />
													{getLocaleLabel(locale)}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							</SettingsSection>

							<SettingsSection
								icon={<IconWorld className="size-3.5" />}
								title="Translations"
							>
								<VaultTranslationsSection
									type={typeConfig.id}
									assetId={asset?.id}
									revision={revision}
									onRevisionChange={setRevision}
								/>
							</SettingsSection>

							<SettingsSection
								icon={<IconFileText className="size-3.5" />}
								title="Description"
								htmlFor="vault-description"
							>
								<Textarea
									id="vault-description"
									value={description}
									onChange={(event) => {
										setDescription(event.target.value);
										markDirty();
									}}
									rows={3}
									placeholder="Brief description..."
									className="resize-none bg-background"
								/>
							</SettingsSection>

							<SettingsSection
								icon={<IconTag className="size-3.5" />}
								title="Tags"
								htmlFor="vault-tag"
							>
								<div className="flex gap-2">
									<Input
										id="vault-tag"
										value={tagInput}
										onChange={(event) => setTagInput(event.target.value)}
										onKeyDown={(event) => {
											if (event.key === "Enter" || event.key === ",") {
												event.preventDefault();
												commitTag();
											}
										}}
										placeholder="Add tag, press Enter..."
										className="bg-background"
									/>
									<Button
										type="button"
										size="icon"
										variant="secondary"
										disabled={!tagInput.trim()}
										aria-label="Add tag"
										onClick={commitTag}
									>
										<IconPlus className="size-3.5" />
									</Button>
								</div>
								{tags.length > 0 ? (
									<div className="mt-3 flex flex-wrap gap-1.5">
										{tags.map((tag) => (
											<span
												key={tag}
												className="inline-flex items-center gap-1 rounded-full border bg-background py-1 pr-1.5 pl-2.5 text-xs shadow-xs"
											>
												<span className="text-muted-foreground/60">#</span>
												{tag}
												<button
													type="button"
													aria-label={`Remove tag ${tag}`}
													className="flex size-4 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
													onClick={() => {
														setTags(tags.filter((value) => value !== tag));
														markDirty();
													}}
												>
													<IconX className="size-3" />
												</button>
											</span>
										))}
									</div>
								) : null}
							</SettingsSection>

							<SettingsSection
								icon={<IconPhoto className="size-3.5" />}
								title="Cover Image"
							>
								<CoverImageSelector
									selectedImageUrl={coverImage}
									onSelectImage={(image) => {
										setCoverImage(image.url);
										markDirty();
									}}
								/>
							</SettingsSection>
						</div>
					</div>
				</aside>
			</div>

			{isRich ? (
				<ImageInsertDialog
					open={imageInsertDialogOpen}
					onClose={() => setImageInsertDialogOpen(false)}
					onSelect={handleImageInsert}
				/>
			) : null}
			{confirmDialog}
		</div>
	);
}
