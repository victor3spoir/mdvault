import { Link, useNavigate, useRouter } from "@tanstack/react-router";
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
import type { Post } from "#/features/posts/posts.types";

interface PostFormProps {
	post?: Post | null;
	articles: Article[];
}

export function PostForm({ post, articles }: PostFormProps) {
	const navigate = useNavigate();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [title, setTitle] = useState(post?.title ?? "");
	const [content, setContent] = useState(post?.content ?? "");
	const [lang, setLang] = useState<"fr" | "en">(post?.lang ?? "fr");
	const [articleId, setArticleId] = useState(post?.article ?? "");
	const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
	const [author, setAuthor] = useState(post?.author ?? "");
	const [published, setPublished] = useState(post?.published ?? false);

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
					router.invalidate();
					await navigate({
						to: "/cms/posts/$slug/edit",
						params: { slug: id },
					});
					return;
				}

				await updatePostMutation({
					data: {
						id: post.id,
						input,
					},
				});
				toast.success("Post saved");
				router.invalidate();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to save post",
				);
			}
		});
	};

	const handleTogglePublish = () => {
		if (!post) {
			return;
		}

		startTransition(async () => {
			try {
				if (published) {
					await unpublishPostMutation({ data: { id: post.id } });
					setPublished(false);
					toast.success("Post unpublished");
				} else {
					await publishPostMutation({ data: { id: post.id } });
					setPublished(true);
					toast.success("Post published");
				}

				router.invalidate();
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
		if (!post?.sha || !window.confirm("Delete this post?")) {
			return;
		}

		startTransition(async () => {
			try {
				await deletePostMutation({
					data: {
						id: post.id,
						sha: post.sha,
					},
				});
				toast.success("Post deleted");
				router.invalidate();
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
