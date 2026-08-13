import { useNavigate, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { EditorTitleInput } from "#/components/editor-title-input";
import {
	createArticleMutation,
	deleteArticleMutation,
	publishArticleMutation,
	unpublishArticleMutation,
	updateArticleMutation,
} from "#/features/articles/articles.functions";
import type { Article } from "#/features/articles/articles.types";
import { getContentStats } from "#/features/articles/articles.utils";
import { ArticleEditorHeader } from "#/features/articles/components/article-editor-header";
import { ArticleEditorSettingsSidebar } from "#/features/articles/components/article-editor-settings-sidebar";
import {
	RichTextEditor,
	type RichTextEditorHandle,
} from "#/features/articles/components/editor/rich-text-editor";
import { MarkdownContent } from "#/features/content/components/markdown-content";
import { ImageInsertDialog } from "#/features/media/components/image-insert-dialog";
import { compressImage } from "#/features/media/media.compress";
import { uploadImageMutation } from "#/features/media/media.functions";
import type { MediaFile } from "#/features/media/media.types";
import type { ContentRevision } from "#/features/shared/content-revision";
import { useContentRefresh } from "#/features/shared/use-content-refresh";
import {
	clearDraft,
	loadDraft,
	useAutosaveDraft,
} from "#/hooks/use-autosave-draft";
import { DELETE_DESCRIPTION, useConfirm } from "#/hooks/use-confirm";
import { useUnsavedChanges } from "#/hooks/use-unsaved-changes";
import { formatDate } from "#/lib/date";
import { cn } from "#/lib/utils";

interface ArticleEditorProps {
	article?: Article | null;
	mode: "create" | "edit";
}

interface ArticleDraft {
	title: string;
	description: string;
	tags: string[];
	coverImage: string;
	lang: "fr" | "en";
	published: boolean;
	content: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
	let binary = "";
	const bytes = new Uint8Array(buffer);
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}

export function ArticleEditor({ article, mode }: ArticleEditorProps) {
	const navigate = useNavigate();
	const router = useRouter();
	const refreshContent = useContentRefresh("articles");
	const editorRef = useRef<RichTextEditorHandle>(null);
	const [isPending, startTransition] = useTransition();
	const { confirm, confirmDialog } = useConfirm();
	const [title, setTitle] = useState(article?.title ?? "");
	const [lang, setLang] = useState<"fr" | "en">(article?.lang ?? "en");
	const [description, setDescription] = useState(article?.description ?? "");
	const [tags, setTags] = useState<string[]>(article?.tags ?? []);
	const [coverImage, setCoverImage] = useState(article?.coverImage ?? "");
	const [published, setPublished] = useState(article?.published ?? false);
	const [editorContent, setEditorContent] = useState(article?.content ?? "");
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [previewMode, setPreviewMode] = useState(false);
	const [imageInsertDialogOpen, setImageInsertDialogOpen] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [revision, setRevision] = useState<ContentRevision | null>(
		article ? { path: article.path, sha: article.sha } : null,
	);
	const allowNavigation = useUnsavedChanges(hasUnsavedChanges);

	const draftKey = `article:${article?.id ?? "new"}`;
	const { savedAt } = useAutosaveDraft<ArticleDraft>(
		draftKey,
		{
			title,
			description,
			tags,
			coverImage,
			lang,
			published,
			content: editorContent,
		},
		{ enabled: hasUnsavedChanges },
	);

	const restoredRef = useRef(false);
	// biome-ignore lint/correctness/useExhaustiveDependencies: run once to offer draft restore
	useEffect(() => {
		if (restoredRef.current) {
			return;
		}
		restoredRef.current = true;

		const draft = loadDraft<ArticleDraft>(draftKey);
		if (!draft) {
			return;
		}

		if (article && new Date(draft.savedAt) <= new Date(article.updatedAt)) {
			clearDraft(draftKey);
			return;
		}

		toast("Unsaved draft found", {
			description: `Saved locally ${formatDate(draft.savedAt)}`,
			duration: 10000,
			action: {
				label: "Restore",
				onClick: () => {
					const data = draft.data;
					setTitle(data.title);
					setDescription(data.description);
					setTags(data.tags);
					setCoverImage(data.coverImage);
					setLang(data.lang);
					setPublished(data.published);
					setEditorContent(data.content);
					editorRef.current?.setMarkdown(data.content);
					setHasUnsavedChanges(true);
				},
			},
		});
	}, []);

	const handleImageUpload = useCallback(
		async (file: File) => {
			const prepared = await compressImage(file);
			const base64 = arrayBufferToBase64(await prepared.arrayBuffer());
			const uploaded = await uploadImageMutation({
				data: {
					fileName: prepared.name,
					mimeType: prepared.type,
					base64,
				},
			});
			router.invalidate();
			return uploaded.url;
		},
		[router],
	);

	const handleImageInsert = (
		image: MediaFile,
		details: { alt: string; caption: string },
	) => {
		const alt = details.alt || "image";
		const markdown = details.caption
			? `![${alt}](${image.url} "${details.caption.replace(/"/g, "'")}")`
			: `![${alt}](${image.url})`;
		editorRef.current?.insertMarkdown(markdown);
		setImageInsertDialogOpen(false);
		setHasUnsavedChanges(true);
	};

	const handleSave = () => {
		if (!coverImage.trim()) {
			toast.warning("Please add a cover image before saving");
			return;
		}

		startTransition(async () => {
			try {
				const content = editorRef.current?.getMarkdown() ?? "";
				const input = {
					title,
					lang,
					content,
					description,
					tags,
					coverImage,
					author: article?.author,
					published,
				};

				if (mode === "create") {
					const id = await createArticleMutation({ data: input });
					setHasUnsavedChanges(false);
					clearDraft(draftKey);
					await refreshContent();
					allowNavigation();
					await navigate({ to: "/cms/articles/$id/edit", params: { id } });
				} else if (article && revision) {
					const nextRevision = await updateArticleMutation({
						data: { id: article.id, input, revision },
					});
					setRevision(nextRevision);
					setHasUnsavedChanges(false);
					clearDraft(draftKey);
					await refreshContent();
				}

				toast.success("Article saved");
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to save article",
				);
			}
		});
	};

	const handleTogglePublish = () => {
		if (!article || !revision) return;
		startTransition(async () => {
			try {
				const nextRevision = published
					? await unpublishArticleMutation({
							data: { id: article.id, revision },
						})
					: await publishArticleMutation({
							data: { id: article.id, revision },
						});
				setRevision(nextRevision);
				setPublished(!published);
				await refreshContent();
				toast.success(published ? "Article unpublished" : "Article published");
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to change status",
				);
			}
		});
	};

	const handleDelete = async () => {
		const currentArticle = article;
		if (!currentArticle || !revision) {
			return;
		}

		const confirmed = await confirm({
			title: `Delete "${currentArticle.title}"?`,
			description: DELETE_DESCRIPTION,
		});

		if (!confirmed) {
			return;
		}
		startTransition(async () => {
			try {
				await deleteArticleMutation({
					data: { id: currentArticle.id, revision },
				});
				clearDraft(draftKey);
				await refreshContent();
				toast.success("Article deleted");
				allowNavigation();
				await navigate({ to: "/cms/articles" });
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to delete article",
				);
			}
		});
	};

	const stats = getContentStats(editorContent);

	const handleTogglePreview = () => {
		setPreviewMode((value) => {
			const next = !value;
			if (next) {
				setSidebarCollapsed(true);
			}
			return next;
		});
	};

	return (
		<div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-background">
			<ArticleEditorHeader
				title={title}
				mode={mode}
				article={article ? { ...article, published } : undefined}
				isSaving={isPending}
				hasUnsavedChanges={hasUnsavedChanges}
				sidebarCollapsed={sidebarCollapsed}
				previewMode={previewMode}
				onSave={handleSave}
				onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
				onTogglePreview={handleTogglePreview}
				onTogglePublish={handleTogglePublish}
				onDelete={handleDelete}
			/>

			<div className="flex flex-1 overflow-hidden">
				<div
					className={cn(
						"flex-col overflow-hidden",
						previewMode ? "hidden lg:flex lg:w-1/2" : "flex flex-1",
					)}
				>
					<div className="shrink-0 border-b bg-linear-to-b from-muted/30 to-transparent px-8 py-6">
						<EditorTitleInput
							value={title}
							placeholder="Article title..."
							ariaLabel="Article title"
							onChange={(value) => {
								setTitle(value);
								setHasUnsavedChanges(true);
							}}
						/>
						<div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
							<span>{stats.wordCount} words</span>
							<span>•</span>
							<span>{stats.readTime} min read</span>
							{savedAt ? (
								<>
									<span>•</span>
									<span>
										Draft saved{" "}
										{new Date(savedAt).toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</span>
								</>
							) : article?.createdAt ? (
								<>
									<span>•</span>
									<span>Created {formatDate(article.createdAt)}</span>
								</>
							) : null}
						</div>
					</div>

					<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
						<RichTextEditor
							ref={editorRef}
							markdown={article?.content ?? ""}
							onImageUpload={handleImageUpload}
							onImageInsertClick={() => setImageInsertDialogOpen(true)}
							onChange={(value) => {
								setEditorContent(value);
								setHasUnsavedChanges(true);
							}}
						/>
					</div>
				</div>

				{previewMode ? (
					<div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-l bg-background lg:w-1/2">
						<div className="sticky top-0 z-10 flex shrink-0 items-center border-b bg-background/95 px-8 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
							Live Preview
						</div>
						<article className="mx-auto w-full max-w-[70ch] px-8 py-8">
							{title ? (
								<h1 className="mb-6 text-4xl font-bold tracking-tight">
									{title}
								</h1>
							) : null}
							{editorContent.trim() ? (
								<MarkdownContent source={editorContent} />
							) : (
								<p className="text-sm text-muted-foreground">
									Nothing to preview yet. Start writing to see it here.
								</p>
							)}
						</article>
					</div>
				) : null}

				<ArticleEditorSettingsSidebar
					lang={lang}
					description={description}
					tags={tags}
					coverImage={coverImage}
					collapsed={sidebarCollapsed}
					onLangChange={(value) => {
						setLang(value);
						setHasUnsavedChanges(true);
					}}
					onDescriptionChange={(value) => {
						setDescription(value);
						setHasUnsavedChanges(true);
					}}
					onTagsChange={(value) => {
						setTags(value);
						setHasUnsavedChanges(true);
					}}
					onCoverImageChange={(value) => {
						setCoverImage(value);
						setHasUnsavedChanges(true);
					}}
				/>
			</div>

			<ImageInsertDialog
				open={imageInsertDialogOpen}
				onClose={() => setImageInsertDialogOpen(false)}
				onSelect={handleImageInsert}
				withDetails
			/>
			{confirmDialog}
		</div>
	);
}
