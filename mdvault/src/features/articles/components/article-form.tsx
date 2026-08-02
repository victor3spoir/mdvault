import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useMemo, useState, useTransition } from "react";
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

interface ArticleFormProps {
	article?: Article | null;
}

export function ArticleForm({ article }: ArticleFormProps) {
	const navigate = useNavigate();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [isPending, startTransition] = useTransition();
	const [title, setTitle] = useState(article?.title ?? "");
	const [description, setDescription] = useState(article?.description ?? "");
	const [content, setContent] = useState(article?.content ?? "");
	const [lang, setLang] = useState<"fr" | "en">(article?.lang ?? "en");
	const [coverImage, setCoverImage] = useState(article?.coverImage ?? "");
	const author = article?.author ?? "";
	const [published, setPublished] = useState(article?.published ?? false);
	const [tags, setTags] = useState(article?.tags?.join(", ") ?? "");

	const mode = article ? "edit" : "create";
	const stats = useMemo(() => getContentStats(content), [content]);

	const handleSave = () => {
		startTransition(async () => {
			try {
				const input = {
					title,
					description,
					content,
					lang,
					coverImage: coverImage.trim() || undefined,
					author: author.trim() || undefined,
					published,
					tags: tags
						.split(",")
						.map((tag) => tag.trim())
						.filter(Boolean),
				};

				if (mode === "create") {
					const id = await createArticleMutation({ data: input });
					toast.success("Article created");
					await invalidateArticleQueries(queryClient);
					await navigate({
						to: "/cms/articles/$id/edit",
						params: { id },
					});
					return;
				}

				if (!article) return;
				await updateArticleMutation({
					data: {
						id: article.id,
						input,
						revision: { path: article.path, sha: article.sha },
					},
				});
				toast.success("Article saved");
				await invalidateArticleQueries(queryClient);
				router.invalidate();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to save article",
				);
			}
		});
	};

	const handleTogglePublish = () => {
		if (!article) {
			return;
		}

		startTransition(async () => {
			try {
				const revision = { path: article.path, sha: article.sha };
				if (published) {
					await unpublishArticleMutation({
						data: { id: article.id, revision },
					});
					setPublished(false);
					toast.success("Article unpublished");
				} else {
					await publishArticleMutation({
						data: { id: article.id, revision },
					});
					setPublished(true);
					toast.success("Article published");
				}

				await invalidateArticleQueries(queryClient);
				router.invalidate();
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: "Failed to update article status",
				);
			}
		});
	};

	const handleDelete = () => {
		const currentArticle = article;
		if (!currentArticle || !window.confirm("Delete this article?")) {
			return;
		}

		startTransition(async () => {
			try {
				await deleteArticleMutation({
					data: {
						id: currentArticle.id,
						revision: {
							path: currentArticle.path,
							sha: currentArticle.sha,
						},
					},
				});
				toast.success("Article deleted");
				await invalidateArticleQueries(queryClient);
				await navigate({ to: "/cms/articles" });
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to delete article",
				);
			}
		});
	};

	return (
		<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
			<Card>
				<CardHeader>
					<CardTitle>
						{mode === "create" ? "New Article" : "Edit Article"}
					</CardTitle>
					<CardDescription>
						This pass edits the markdown source directly. The richer MDX editor
						can be layered back in after the route and mutation flow is stable.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="article-title">Title</Label>
						<Input
							id="article-title"
							value={title}
							onChange={(event) => setTitle(event.target.value)}
							placeholder="Article title"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="article-description">Description</Label>
						<Textarea
							id="article-description"
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							placeholder="Short article description"
							rows={4}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="article-content">Markdown Content</Label>
						<Textarea
							id="article-content"
							value={content}
							onChange={(event) => setContent(event.target.value)}
							placeholder="Write markdown here..."
							rows={24}
							className="font-mono text-sm"
						/>
						<p className="text-xs text-muted-foreground">
							{stats.wordCount} words, about {stats.readTime} min read
						</p>
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
							<Label htmlFor="article-lang">Language</Label>
							<Select
								value={lang}
								onValueChange={(value) => setLang(value as "fr" | "en")}
							>
								<SelectTrigger id="article-lang">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="en">English</SelectItem>
									<SelectItem value="fr">Français</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="article-status">Status</Label>
							<Select
								value={published ? "published" : "draft"}
								onValueChange={(value) => setPublished(value === "published")}
							>
								<SelectTrigger id="article-status">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="draft">Draft</SelectItem>
									<SelectItem value="published">Published</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="article-cover-image">Cover Image</Label>
							<Input
								id="article-cover-image"
								value={coverImage}
								onChange={(event) => setCoverImage(event.target.value)}
								placeholder="media/cover.jpg or https://..."
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="article-tags">Tags</Label>
							<Input
								id="article-tags"
								value={tags}
								onChange={(event) => setTags(event.target.value)}
								placeholder="react, tanstack, markdown"
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
							disabled={isPending || !title.trim() || !description.trim()}
						>
							{isPending
								? "Saving..."
								: mode === "create"
									? "Create Article"
									: "Save Article"}
						</Button>

						{article ? (
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
									<Link to="/cms/articles/$id" params={{ id: article.id }}>
										View Article
									</Link>
								</Button>
								<Button
									variant="destructive"
									className="w-full"
									onClick={handleDelete}
									disabled={isPending}
								>
									Delete Article
								</Button>
							</>
						) : null}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
