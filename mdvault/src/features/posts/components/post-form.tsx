import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import type { Article } from "#/features/articles/articles.types";
import {
	createPostMutation,
	deletePostMutation,
	publishPostMutation,
	unpublishPostMutation,
	updatePostMutation,
} from "#/features/posts/posts.functions";
import { invalidatePostQueries } from "#/features/posts/posts.queries";
import type { Post } from "#/features/posts/posts.types";
import type { ContentRevision } from "#/features/shared/content-revision";
import { useUnsavedChanges } from "#/hooks/use-unsaved-changes";

interface PostFormProps {
	post?: Post | null;
	articles: Article[];
}

type PostDraft = {
	title: string;
	content: string;
	lang: "fr" | "en";
	articleId: string;
	coverImage: string;
	author: string;
	published: boolean;
};

export function PostForm({ post, articles }: PostFormProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [isPending, startTransition] = useTransition();
	const [title, setTitle] = useState(post?.title ?? "");
	const [content, setContent] = useState(post?.content ?? "");
	const [lang, setLang] = useState<"fr" | "en">(post?.lang ?? "fr");
	const [articleId, setArticleId] = useState(post?.article ?? "");
	const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
	const [author, setAuthor] = useState(post?.author ?? "");
	const [published, setPublished] = useState(post?.published ?? false);
	const [revision, setRevision] = useState<ContentRevision | null>(
		post ? { path: post.path, sha: post.sha } : null,
	);
	const [savedDraft, setSavedDraft] = useState<PostDraft>(() => ({
		title: post?.title ?? "",
		content: post?.content ?? "",
		lang: post?.lang ?? "fr",
		articleId: post?.article ?? "",
		coverImage: post?.coverImage ?? "",
		author: post?.author ?? "",
		published: post?.published ?? false,
	}));
	const currentDraft: PostDraft = {
		title,
		content,
		lang,
		articleId,
		coverImage,
		author,
		published,
	};
	const hasUnsavedChanges =
		currentDraft.title !== savedDraft.title ||
		currentDraft.content !== savedDraft.content ||
		currentDraft.lang !== savedDraft.lang ||
		currentDraft.articleId !== savedDraft.articleId ||
		currentDraft.coverImage !== savedDraft.coverImage ||
		currentDraft.author !== savedDraft.author ||
		currentDraft.published !== savedDraft.published;
	const allowNavigation = useUnsavedChanges(hasUnsavedChanges);

	const mode = post ? "edit" : "create";

	const handleSave = () => {
		startTransition(async () => {
			try {
				const input = {
					title,
					content,
					lang,
					article: articleId || undefined,
					coverImage: coverImage.trim() || undefined,
					author: author.trim() || undefined,
					published,
				};

				if (mode === "create") {
					const id = await createPostMutation({ data: input });
					toast.success("Post created");
					await invalidatePostQueries(queryClient);
					allowNavigation();
					await navigate({
						to: "/cms/posts/$slug/edit",
						params: { slug: id },
					});
					return;
				}

				if (!post || !revision) return;
				const nextRevision = await updatePostMutation({
					data: {
						id: post.id,
						input,
						revision,
					},
				});
				setRevision(nextRevision);
				setSavedDraft(currentDraft);
				toast.success("Post saved");
				await invalidatePostQueries(queryClient);
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
					? await unpublishPostMutation({
							data: { id: post.id, revision },
						})
					: await publishPostMutation({
							data: { id: post.id, revision },
						});
				const nextPublished = !published;
				setRevision(nextRevision);
				setPublished(nextPublished);
				setSavedDraft((current) => ({
					...current,
					published: nextPublished,
				}));
				toast.success(published ? "Post unpublished" : "Post published");
				await invalidatePostQueries(queryClient);
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: "Failed to update post status",
				);
			}
		});
	};

	const handleDelete = () => {
		const currentPost = post;
		if (!currentPost || !revision || !window.confirm("Delete this post?")) {
			return;
		}

		startTransition(async () => {
			try {
				await deletePostMutation({
					data: {
						id: currentPost.id,
						revision,
					},
				});
				toast.success("Post deleted");
				await invalidatePostQueries(queryClient);
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
		<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
			<Card>
				<CardHeader>
					<CardTitle>{mode === "create" ? "New Post" : "Edit Post"}</CardTitle>
					<CardDescription>
						Posts are edited as plain markdown content in this pass.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="post-title">Title</Label>
						<Input
							id="post-title"
							value={title}
							onChange={(event) => setTitle(event.target.value)}
							placeholder="Post title"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="post-content">Content</Label>
						<Textarea
							id="post-content"
							value={content}
							onChange={(event) => setContent(event.target.value)}
							placeholder="Write the post content here..."
							rows={20}
							className="font-mono text-sm"
						/>
					</div>
				</CardContent>
			</Card>

			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Metadata</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="post-lang">Language</Label>
							<Select
								value={lang}
								onValueChange={(value) => setLang(value as "fr" | "en")}
							>
								<SelectTrigger id="post-lang">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="fr">Français</SelectItem>
									<SelectItem value="en">English</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="post-status">Status</Label>
							<Select
								value={published ? "published" : "draft"}
								onValueChange={(value) => setPublished(value === "published")}
							>
								<SelectTrigger id="post-status">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="draft">Draft</SelectItem>
									<SelectItem value="published">Published</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="post-author">Author</Label>
							<Input
								id="post-author"
								value={author}
								onChange={(event) => setAuthor(event.target.value)}
								placeholder="Author name"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="post-article">Related Article</Label>
							<Select
								value={articleId || "__none"}
								onValueChange={(value) =>
									setArticleId(value === "__none" ? "" : value)
								}
							>
								<SelectTrigger id="post-article">
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
						</div>

						<div className="space-y-2">
							<Label htmlFor="post-cover-image">Cover Image</Label>
							<Input
								id="post-cover-image"
								value={coverImage}
								onChange={(event) => setCoverImage(event.target.value)}
								placeholder="media/post-cover.jpg or https://..."
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Actions</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button
							className="w-full"
							onClick={handleSave}
							disabled={isPending || !title.trim() || !content.trim()}
						>
							{isPending
								? "Saving..."
								: mode === "create"
									? "Create Post"
									: "Save Post"}
						</Button>

						{post ? (
							<>
								<Button
									variant="outline"
									className="w-full"
									onClick={handleTogglePublish}
									disabled={isPending}
								>
									{published ? "Unpublish" : "Publish"}
								</Button>
								<Button variant="outline" className="w-full" asChild>
									<Link to="/cms/posts/$slug" params={{ slug: post.id }}>
										View Post
									</Link>
								</Button>
								<Button
									variant="destructive"
									className="w-full"
									onClick={handleDelete}
									disabled={isPending}
								>
									Delete Post
								</Button>
							</>
						) : null}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
