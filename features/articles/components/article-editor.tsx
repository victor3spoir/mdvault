"use client";

import type { MDXEditorMethods } from "@mdxeditor/editor";
import {
  IconDeviceFloppy,
  IconFileText,
  IconLoader2,
  IconPhoto,
  IconPlus,
  IconSend,
  IconTags,
  IconX,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { UploadedImage } from "@/features/medias/medias.types";
import { CoverImageSelector } from "../../medias/components/cover-image-selector";
import { ImageInsertDialog } from "../../medias/components/image-insert-dialog";
import { uploadImageAction } from "../../medias/medias.actions";
import {
  createArticleAction,
  updateArticleAction,
} from "../articles.actions";
import type { Article, CreateArticleInput } from "../articles.types";
import ArticleDeleteDialog from "./article-delete-dialog";
import { ArticleUnpublishDialog } from "./article-unpublish-dialog";
import { ForwardRefEditor } from "./forward-ref-editor";

interface ArticleEditorProps {
  article?: Article;
  mode: "create" | "edit";
}

export function ArticleEditor({ article, mode }: ArticleEditorProps) {
  const router = useRouter();
  const editorRef = useRef<MDXEditorMethods>(null);

  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [description, setDescription] = useState(article?.description ?? "");
  const [tags, setTags] = useState<string[]>(article?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState(article?.coverImage ?? "");
  const [imageInsertDialogOpen, setImageInsertDialogOpen] = useState(false);
  const [isSavePending, startSaveTransition] = useTransition();
  const [isPublishPending, startPublishTransition] = useTransition();

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (mode === "create") {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(generatedSlug);
    }
  };

  // Tag management
  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Image upload handler for MDXEditor
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const uploadedImage = await uploadImageAction(file);
    return uploadedImage.url;
  }, []);

  // Handle image insert from dialog
  const handleImageInsert = (image: UploadedImage) => {
    if (editorRef.current) {
      editorRef.current.insertMarkdown(`![image](${image.url})`);
    }
    setImageInsertDialogOpen(false);
  };

  // Save as draft
  const handleSave = () => {
    startSaveTransition(async () => {
      try {
        const content = editorRef.current?.getMarkdown() ?? "";
        const input: CreateArticleInput = {
          title,
          slug,
          content,
          description,
          tags,
          coverImage,
          published: false,
        };

        if (mode === "create") {
          await createArticleAction(input);
        } else if (article?.sha) {
          await updateArticleAction(slug, { ...input, sha: article.sha });
        }

        toast.success("Article saved as draft");
        router.push("/cms/articles");
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to save article";
        toast.error(message);
        console.error("Error saving article:", error);
      }
    });
  };

  // Publish article
  const handlePublish = () => {
    startPublishTransition(async () => {
      try {
        const content = editorRef.current?.getMarkdown() ?? "";
        const input: CreateArticleInput = {
          title,
          slug,
          content,
          description,
          tags,
          coverImage,
          published: true,
        };

        if (mode === "create") {
          await createArticleAction(input);
        } else if (article?.sha) {
          await updateArticleAction(slug, { ...input, sha: article.sha });
        }

        toast.success("Article published successfully");
        router.push("/cms/articles");
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to publish article";
        toast.error(message);
        console.error("Error publishing article:", error);
      }
    });
  };

  return (
    <div className="flex flex-col w-full">
      {/* Sticky Actions Bar */}
      <div className="sticky top-14 z-20 -mx-6 -mt-6 mb-6 flex items-center justify-between gap-4 border-b bg-background/95 px-6 py-3 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {mode === "create" ? "New Article" : article?.title}
          </span>
          {article?.published && (
            <Badge
              variant="secondary"
              className="h-5 rounded px-1.5 text-[10px] font-semibold uppercase"
            >
              Published
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {mode === "edit" && article?.published && article?.sha && (
            <ArticleUnpublishDialog
              articleSlug={slug}
              articleSha={article.sha}
            />
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSavePending || !title || !slug}
            className="h-8 gap-1.5 rounded-lg"
          >
            {isSavePending ? (
              <IconLoader2 className="size-3.5 animate-spin" />
            ) : (
              <IconDeviceFloppy className="size-3.5" />
            )}
            <span className="hidden sm:inline">Save Draft</span>
          </Button>

          {!article?.published && (
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={isPublishPending || !title || !slug}
              className="h-8 gap-1.5 rounded-lg"
            >
              {isPublishPending ? (
                <IconLoader2 className="size-3.5 animate-spin" />
              ) : (
                <IconSend className="size-3.5" />
              )}
              <span className="hidden sm:inline">Publish</span>
            </Button>
          )}

          {mode === "edit" && article?.sha && (
            <ArticleDeleteDialog
              articleSlug={slug}
              articleSha={article.sha}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Metadata Section: Title, Description, Cover Image, Slug, Tags */}
        <div className="rounded-3xl border bg-card/50 p-6 backdrop-blur-sm transition-all focus-within:border-primary/20 focus-within:shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
            {/* Left Column: Title & Description */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-semibold">
                  Title
                </Label>
                <Input
                  id="title"
                  placeholder="Enter a catchy title..."
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="h-12 rounded-2xl border-muted bg-muted/30 px-4 text-lg font-bold transition-all focus-visible:ring-1 focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="What is this article about? (SEO friendly description)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="rounded-2xl border-muted bg-muted/30 px-4 py-3 transition-all focus-visible:ring-1 focus-visible:ring-primary/20"
                />
              </div>
            </div>
            {/* Settings & Tags */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <IconFileText className="size-4 text-primary" />
                  Article Settings
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="slug"
                    className="text-[12px] font-medium text-muted-foreground"
                  >
                    URL Slug
                  </Label>
                  <Input
                    id="slug"
                    placeholder="article-url-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    disabled={mode === "edit"}
                    className="h-10 rounded-xl border-muted bg-muted/30 px-3 text-sm transition-all focus-visible:ring-1 focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <IconTags className="size-4 text-primary" />
                  Tags
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="h-10 rounded-xl border-muted bg-muted/30 px-3 text-sm transition-all focus-visible:ring-1 focus-visible:ring-primary/20"
                  />
                  <Button
                    onClick={addTag}
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl transition-transform active:scale-95"
                    disabled={!tagInput.trim()}
                  >
                    <IconPlus className="size-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="h-7 gap-1 rounded-lg bg-muted/50 px-2 text-[11px] font-medium transition-colors hover:bg-muted"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 rounded-full p-0.5 transition-colors hover:bg-destructive hover:text-destructive-foreground"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <IconX className="size-3" />
                      </button>
                    </Badge>
                  ))}
                  {tags.length === 0 && (
                    <p className="text-[12px] text-muted-foreground italic">
                      No tags added yet
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Cover Image, Slug, Tags */}
            <div className="space-y-8">
              {/* Cover Image */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <IconPhoto className="size-4 text-primary" />
                  Cover Image
                </div>
                <CoverImageSelector
                  selectedImageUrl={coverImage}
                  onSelectImage={(image) => setCoverImage(image.url)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Editor Section */}
        <div className="rounded-2xl border border-muted bg-background overflow-hidden">
          <ForwardRefEditor
            ref={editorRef}
            markdown={article?.content ?? ""}
            onImageUpload={handleImageUpload}
            onImageInsertClick={() => setImageInsertDialogOpen(true)}
          />
        </div>
      </div>

      <ImageInsertDialog
        open={imageInsertDialogOpen}
        onClose={() => setImageInsertDialogOpen(false)}
        onSelect={handleImageInsert}
      />
    </div>
  );
}
