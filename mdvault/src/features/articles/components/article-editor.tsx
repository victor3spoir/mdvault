import type { MDXEditorMethods } from "@mdxeditor/editor";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useCallback, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	createArticleMutation,
	deleteArticleMutation,
	publishArticleMutation,
	unpublishArticleMutation,
	updateArticleMutation,
} from "#/features/articles/articles.functions";
import { invalidateArticleQueries } from "#/features/articles/articles.queries";
import type { Article } from "#/features/articles/articles.types";
import { getContentStats } from "#/features/articles/articles.utils";
import { ArticleEditorHeader } from "#/features/articles/components/article-editor-header";
import { ArticleEditorSettingsSidebar } from "#/features/articles/components/article-editor-settings-sidebar";
import { ForwardRefEditor } from "#/features/articles/components/forward-ref-editor";
import { ImageInsertDialog } from "#/features/media/components/image-insert-dialog";
import { uploadImageMutation } from "#/features/media/media.functions";
import { mediaDataUrlQueryOptions } from "#/features/media/media.queries";
import type { MediaFile } from "#/features/media/media.types";
import type { ContentRevision } from "#/features/shared/content-revision";
import { useUnsavedChanges } from "#/hooks/use-unsaved-changes";
import { formatDate } from "#/lib/date";

interface ArticleEditorProps {
	article?: Article | null;
	mode: "create" | "edit";
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
	const queryClient = useQueryClient();
	const editorRef = useRef<MDXEditorMethods>(null);
	const [isPending, startTransition] = useTransition();
	const [title, setTitle] = useState(article?.title ?? "");
	const [lang, setLang] = useState<"fr" | "en">(article?.lang ?? "en");
	const [description, setDescription] = useState(article?.description ?? "");
	const [tags, setTags] = useState<string[]>(article?.tags ?? []);
	const [coverImage, setCoverImage] = useState(article?.coverImage ?? "");
	const [published, setPublished] = useState(article?.published ?? false);
	const [editorContent, setEditorContent] = useState(article?.content ?? "");
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [imageInsertDialogOpen, setImageInsertDialogOpen] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [revision, setRevision] = useState<ContentRevision | null>(
		article ? { path: article.path, sha: article.sha } : null,
	);
	const allowNavigation = useUnsavedChanges(hasUnsavedChanges);

	const handleImageUpload = useCallback(
		async (file: File) => {
			const base64 = arrayBufferToBase64(await file.arrayBuffer());
			const uploaded = await uploadImageMutation({
				data: {
					fileName: file.name,
					mimeType: file.type,
					base64,
				},
			});
			router.invalidate();
			return uploaded.url;
		},
		[router],
	);

	const imagePreviewHandler = useCallback(
		async (src: string) => {
			const trimmed = src.trim();
			if (
				!trimmed ||
				trimmed.startsWith("http") ||
				trimmed.startsWith("data:") ||
				trimmed.startsWith("blob:")
			) {
				return trimmed;
			}

			return queryClient.ensureQueryData(mediaDataUrlQueryOptions(trimmed));
		},
		[queryClient],
	);

	const handleImageInsert = (image: MediaFile) => {
		editorRef.current?.insertMarkdown(`![image](${image.url})`);
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
					await invalidateArticleQueries(queryClient);
					allowNavigation();
					await navigate({ to: "/cms/articles/$id/edit", params: { id } });
				} else if (article && revision) {
					const nextRevision = await updateArticleMutation({
						data: { id: article.id, input, revision },
					});
					setRevision(nextRevision);
					setHasUnsavedChanges(false);
					await invalidateArticleQueries(queryClient);
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
				await invalidateArticleQueries(queryClient);
				toast.success(published ? "Article unpublished" : "Article published");
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to change status",
				);
			}
		});
	};

	const handleDelete = () => {
		const currentArticle = article;
		if (
			!currentArticle ||
			!revision ||
			!window.confirm("Delete this article?")
		) {
			return;
		}
		startTransition(async () => {
			try {
				await deleteArticleMutation({
					data: { id: currentArticle.id, revision },
				});
				await invalidateArticleQueries(queryClient);
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

	return (
		<div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-background">
			<ArticleEditorHeader
				title={title}
				mode={mode}
				article={article ? { ...article, published } : undefined}
				isSaving={isPending}
				hasUnsavedChanges={hasUnsavedChanges}
				sidebarCollapsed={sidebarCollapsed}
				onSave={handleSave}
				onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
				onTogglePublish={handleTogglePublish}
				onDelete={handleDelete}
			/>

			<div className="flex flex-1 overflow-hidden">
				<div className="flex flex-1 flex-col overflow-hidden">
					<div className="shrink-0 border-b bg-linear-to-b from-muted/30 to-transparent px-8 py-6">
						<input
							type="text"
							placeholder="Article title..."
							value={title}
							aria-label="Article title"
							onChange={(event) => {
								setTitle(event.target.value);
								setHasUnsavedChanges(true);
							}}
							className="w-full bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/40"
						/>
						<div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
							<span>{stats.wordCount} words</span>
							<span>•</span>
							<span>{stats.readTime} min read</span>
							{article?.createdAt ? (
								<>
									<span>•</span>
									<span>Created {formatDate(article.createdAt)}</span>
								</>
							) : null}
						</div>
					</div>

					<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
						<ForwardRefEditor
							ref={editorRef}
							markdown={article?.content ?? ""}
							onImageUpload={handleImageUpload}
							imagePreviewHandler={imagePreviewHandler}
							onImageInsertClick={() => setImageInsertDialogOpen(true)}
							onChange={(value) => {
								setEditorContent(value);
								setHasUnsavedChanges(true);
							}}
						/>
					</div>
				</div>

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
					onCollapse={() => setSidebarCollapsed(true)}
				/>
			</div>

			<ImageInsertDialog
				open={imageInsertDialogOpen}
				onClose={() => setImageInsertDialogOpen(false)}
				onSelect={handleImageInsert}
			/>
		</div>
	);
}
