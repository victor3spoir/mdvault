import {
	IconArrowLeft,
	IconArticle,
	IconCheck,
	IconCloud,
	IconCloudOff,
	IconDeviceFloppy,
	IconExternalLink,
	IconEye,
	IconFileText,
	IconLanguage,
	IconLoader2,
	IconPhoto,
	IconSettings,
	IconTrash,
	IconUser,
	IconWorldOff,
	IconWorldUpload,
} from "@tabler/icons-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { EditorTitleInput } from "#/components/editor-title-input";
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
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import type { Article } from "#/features/articles/articles.types";
import { getContentStats } from "#/features/articles/articles.utils";
import { CoverImageSelector } from "#/features/media/components/cover-image-selector";
import {
	PlainTextEditor,
	type PlainTextEditorHandle,
} from "#/features/posts/components/plain-text-editor";
import {
	createPostMutation,
	deletePostMutation,
	publishPostMutation,
	unpublishPostMutation,
	updatePostMutation,
} from "#/features/posts/posts.functions";
import type { Post } from "#/features/posts/posts.types";
import type { ContentRevision } from "#/features/shared/content-revision";
import { useContentRefresh } from "#/features/shared/use-content-refresh";
import { DELETE_DESCRIPTION, useConfirm } from "#/hooks/use-confirm";
import { useUnsavedChanges } from "#/hooks/use-unsaved-changes";
import { cn } from "#/lib/utils";

interface PostEditorProps {
	post?: Post | null;
	articles: Article[];
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

export function PostEditor({ post, articles }: PostEditorProps) {
	const navigate = useNavigate();
	const refreshContent = useContentRefresh("posts");
	const editorRef = useRef<PlainTextEditorHandle>(null);
	const [isPending, startTransition] = useTransition();
	const { confirm, confirmDialog } = useConfirm();
	const [title, setTitle] = useState(post?.title ?? "");
	const [content, setContent] = useState(post?.content ?? "");
	const [lang, setLang] = useState<"fr" | "en">(post?.lang ?? "fr");
	const [articleId, setArticleId] = useState(post?.article ?? "");
	const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
	const [author, setAuthor] = useState(post?.author ?? "");
	const [published, setPublished] = useState(post?.published ?? false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [revision, setRevision] = useState<ContentRevision | null>(
		post ? { path: post.path, sha: post.sha } : null,
	);
	const allowNavigation = useUnsavedChanges(hasUnsavedChanges);

	const mode = post ? "edit" : "create";
	const stats = getContentStats(content);

	const markDirty = () => setHasUnsavedChanges(true);

	const handleSave = () => {
		const markdown = editorRef.current?.getMarkdown() ?? "";
		if (!markdown.trim()) {
			toast.warning("Write some content before saving");
			return;
		}

		startTransition(async () => {
			try {
				const input = {
					title,
					content: markdown,
					lang,
					article: articleId || undefined,
					coverImage: coverImage.trim() || undefined,
					author: author.trim() || undefined,
					published,
				};

				if (mode === "create") {
					const id = await createPostMutation({ data: input });
					toast.success("Post created");
					await refreshContent();
					setHasUnsavedChanges(false);
					allowNavigation();
					await navigate({
						to: "/cms/posts/$slug/edit",
						params: { slug: id },
					});
					return;
				}

				if (!post || !revision) return;
				const nextRevision = await updatePostMutation({
					data: { id: post.id, input, revision },
				});
				setRevision(nextRevision);
				setHasUnsavedChanges(false);
				toast.success("Post saved");
				await refreshContent();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to save post",
				);
			}
		});
	};

	const handleTogglePublish = () => {
		if (!post || !revision) {
			return;
		}

		startTransition(async () => {
			try {
				const nextRevision = published
					? await unpublishPostMutation({ data: { id: post.id, revision } })
					: await publishPostMutation({ data: { id: post.id, revision } });
				setRevision(nextRevision);
				setPublished(!published);
				toast.success(published ? "Post unpublished" : "Post published");
				await refreshContent();
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: "Failed to update post status",
				);
			}
		});
	};

	const handleDelete = async () => {
		const currentPost = post;
		if (!currentPost || !revision) {
			return;
		}

		const confirmed = await confirm({
			title: `Delete "${currentPost.title}"?`,
			description: DELETE_DESCRIPTION,
		});

		if (!confirmed) {
			return;
		}

		startTransition(async () => {
			try {
				await deletePostMutation({
					data: { id: currentPost.id, revision },
				});
				toast.success("Post deleted");
				await refreshContent();
				allowNavigation();
				await navigate({ to: "/cms/posts" });
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to delete post",
				);
			}
		});
	};

	return (
		<div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-background">
			<header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
				<div className="flex items-center gap-3">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="size-8 rounded-lg"
								aria-label="Back to posts"
								asChild
							>
								<Link to="/cms/posts">
									<IconArrowLeft className="size-4" />
								</Link>
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">Back to posts</TooltipContent>
					</Tooltip>

					<Separator orientation="vertical" className="h-5" />

					<nav className="flex items-center gap-2 text-sm">
						<Link
							to="/cms/posts"
							className="text-muted-foreground transition-colors hover:text-foreground"
						>
							Posts
						</Link>
						<span className="text-muted-foreground/50">›</span>
						<span className="max-w-60 truncate font-medium">
							{title || "Untitled"}
						</span>
					</nav>

					<div className="ml-3 flex items-center gap-2">
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
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="size-8 rounded-lg"
								aria-label="Save post"
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
							{isPending ? "Saving..." : "Save post"}
						</TooltipContent>
					</Tooltip>

					{mode === "edit" && post ? (
						<>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="size-8 rounded-lg"
										aria-label={published ? "Unpublish post" : "Publish post"}
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
										className="size-8 rounded-lg"
										aria-label="View post"
										asChild
									>
										<Link to="/cms/posts/$slug" params={{ slug: post.id }}>
											<IconEye className="size-4" />
										</Link>
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">View post</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="size-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
										aria-label="Delete post"
										onClick={handleDelete}
									>
										<IconTrash className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">Delete post</TooltipContent>
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
									sidebarCollapsed
										? "Open post settings"
										: "Close post settings"
								}
								aria-controls="post-settings-sidebar"
								aria-expanded={!sidebarCollapsed}
								onClick={() => setSidebarCollapsed((value) => !value)}
							>
								<IconSettings className="size-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{sidebarCollapsed ? "Post settings" : "Close settings"}
						</TooltipContent>
					</Tooltip>
				</div>
			</header>

			<div className="flex flex-1 overflow-hidden">
				<div className="flex flex-1 flex-col overflow-hidden">
					<div className="shrink-0 border-b bg-linear-to-b from-muted/30 to-transparent px-8 py-6">
						<EditorTitleInput
							value={title}
							placeholder="Post title..."
							ariaLabel="Post title"
							onChange={(value) => {
								setTitle(value);
								markDirty();
							}}
						/>
						<div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
							<span>{stats.wordCount} words</span>
							<span>•</span>
							<span>Plain text post</span>
						</div>
					</div>

					<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
						<PlainTextEditor
							ref={editorRef}
							markdown={post?.content ?? ""}
							placeholder="Write your post... plain text only, like a LinkedIn post."
							onChange={(value) => {
								setContent(value);
								markDirty();
							}}
						/>
					</div>
				</div>

				<aside
					id="post-settings-sidebar"
					aria-label="Post settings"
					className={cn(
						"shrink-0 border-l bg-muted/20 transition-[width,opacity] duration-200 ease-out",
						sidebarCollapsed ? "w-0 overflow-hidden" : "w-80",
					)}
				>
					<div className="flex h-full w-80 flex-col overflow-hidden">
						<div className="flex h-12 shrink-0 items-center justify-between border-b bg-background/60 px-4 backdrop-blur-sm">
							<h3 className="text-sm font-semibold">Post Settings</h3>
						</div>

						<div className="flex-1 overflow-y-auto">
							<SettingsSection
								icon={<IconLanguage className="size-3.5" />}
								title="Language"
								htmlFor="post-language"
							>
								<Select
									value={lang}
									onValueChange={(value) => {
										setLang(value as "fr" | "en");
										markDirty();
									}}
								>
									<SelectTrigger id="post-language" className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectItem value="en">
												<span aria-hidden="true">🇬🇧</span> English
											</SelectItem>
											<SelectItem value="fr">
												<span aria-hidden="true">🇫🇷</span> Français
											</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
							</SettingsSection>

							<SettingsSection
								icon={<IconUser className="size-3.5" />}
								title="Author"
								htmlFor="post-author"
							>
								<Input
									id="post-author"
									value={author}
									onChange={(event) => {
										setAuthor(event.target.value);
										markDirty();
									}}
									placeholder="Author name"
									className="bg-background"
								/>
							</SettingsSection>

							<SettingsSection
								icon={<IconArticle className="size-3.5" />}
								title="Related Article"
								htmlFor="post-article"
							>
								<Select
									value={articleId || "__none"}
									onValueChange={(value) => {
										setArticleId(value === "__none" ? "" : value);
										markDirty();
									}}
								>
									<SelectTrigger id="post-article" className="w-full">
										<SelectValue placeholder="Select an article" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="__none">None</SelectItem>
										{articles.map((article) => (
											<SelectItem key={article.id} value={article.id}>
												{article.title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{articleId ? (
									<Link
										to="/cms/articles/$id"
										params={{ id: articleId }}
										className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
									>
										<IconExternalLink className="size-3" />
										Open related article
									</Link>
								) : (
									<p className="mt-2 text-[11px] text-muted-foreground/70">
										Optionally link this post to one of your articles.
									</p>
								)}
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
			{confirmDialog}
		</div>
	);
}
