"use client";

import type { MDXEditorMethods } from "@mdxeditor/editor";
import {
  IconArrowLeft,
  IconCheck,
  IconChevronRight,
  IconCloud,
  IconCloudOff,
  IconDeviceFloppy,
  IconDots,
  IconEye,
  IconFileText,
  IconHash,
  IconLoader2,
  IconPhoto,
  IconPlus,
  IconSend,
  IconSettings,
  IconTag,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MediaFile  } from "@/features/medias/medias.types";
import { cn } from "@/lib/utils";
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

interface ArticleEditorLayoutProps {
  article?: Article;
  mode: "create" | "edit";
}

export function ArticleEditorLayout({
  article,
  mode,
}: ArticleEditorLayoutProps) {
  const router = useRouter();
  const editorRef = useRef<MDXEditorMethods>(null);

  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [description, setDescription] = useState(article?.description ?? "");
  const [tags, setTags] = useState<string[]>(article?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState(article?.coverImage ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [imageInsertDialogOpen, setImageInsertDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    setHasUnsavedChanges(true);
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
      setHasUnsavedChanges(true);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
    setHasUnsavedChanges(true);
  };

  // Image upload handler for MDXEditor
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const result = await uploadImageAction(file);
    if (result.success) {
      return result.data.url;
    }
    throw new Error(result.error);
  }, []);

  // Handle image insert from dialog
  const handleImageInsert = (image: MediaFile ) => {
    if (editorRef.current) {
      editorRef.current.insertMarkdown(`![image](${image.url})`);
    }
    setImageInsertDialogOpen(false);
  };

  // Save as draft
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const content = editorRef.current?.getMarkdown() ?? "";
      const input: CreateArticleInput = {
        title,
        slug,
        content,
        description,
        tags,
        coverImage,
        published: article?.published ?? false,
      };

      if (mode === "create") {
        await createArticleAction(input);
      } else if (article?.sha) {
        await updateArticleAction(slug, { ...input, sha: article.sha });
      }

      setHasUnsavedChanges(false);
      toast.success("Changes saved", {
        description: "Your article has been saved successfully",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save article";
      toast.error(message);
      console.error("Error saving article:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Publish article
  const handlePublish = async () => {
    setIsPublishing(true);
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

      toast.success("Article published!", {
        description: "Your article is now live",
      });
      router.push("/cms/articles");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to publish article";
      toast.error(message);
      console.error("Error publishing article:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const wordCount =
    editorRef.current?.getMarkdown().split(/\s+/).filter(Boolean).length ?? 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top Navigation Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
        {/* Left: Back & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
                asChild
              >
                <Link href="/cms/articles">
                  <IconArrowLeft className="size-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Back to Articles</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5" />

          <nav className="flex items-center gap-1.5 text-sm">
            <Link
              href="/cms/articles"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Articles
            </Link>
            <IconChevronRight className="size-3.5 text-muted-foreground/50" />
            <span className="max-w-50 truncate font-medium">
              {title || "Untitled"}
            </span>
          </nav>

          {/* Status Indicator */}
          <div className="ml-3 flex items-center gap-2">
            {article?.published ? (
              <Badge
                variant="secondary"
                className="h-5 gap-1 rounded-full bg-emerald-500/10 px-2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
              >
                <IconCheck className="size-3" />
                Published
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="h-5 gap-1 rounded-full bg-amber-500/10 px-2 text-[10px] font-medium text-amber-600 dark:text-amber-400"
              >
                <IconFileText className="size-3" />
                Draft
              </Badge>
            )}

            {hasUnsavedChanges && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <IconCloudOff className="size-3" />
                Unsaved
              </span>
            )}
            {!hasUnsavedChanges && mode === "edit" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <IconCloud className="size-3" />
                Saved
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-lg text-muted-foreground"
                asChild
              >
                <Link href={`/cms/articles/${slug}`} target="_blank">
                  <IconEye className="size-3.5" />
                  <span className="hidden sm:inline">Preview</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Preview article</TooltipContent>
          </Tooltip>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !title || !slug}
            className="h-8 gap-1.5 rounded-lg"
          >
            {isSaving ? (
              <IconLoader2 className="size-3.5 animate-spin" />
            ) : (
              <IconDeviceFloppy className="size-3.5" />
            )}
            <span className="hidden sm:inline">Save</span>
          </Button>

          {!article?.published && (
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={isPublishing || !title || !slug}
              className="h-8 gap-1.5 rounded-lg bg-primary shadow-sm shadow-primary/20"
            >
              {isPublishing ? (
                <IconLoader2 className="size-3.5 animate-spin" />
              ) : (
                <IconSend className="size-3.5" />
              )}
              <span className="hidden sm:inline">Publish</span>
            </Button>
          )}

          {/* Settings sidebar toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={sidebarCollapsed ? "secondary" : "ghost"}
                size="icon"
                className="size-8 rounded-lg"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <IconSettings className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {sidebarCollapsed ? "Show" : "Hide"} Settings
            </TooltipContent>
          </Tooltip>

          {mode === "edit" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg"
                >
                  <IconDots className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                {article?.published && (
                  <>
                    <ArticleUnpublishDialog
                      articleSlug={slug}
                      articleSha={article.sha}
                    />
                    <DropdownMenuSeparator />
                  </>
                )}
                <ArticleDeleteDialog
                  articleSha={article?.sha}
                  articleSlug={slug}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Panel - Takes remaining space */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Title Input - Clean, prominent */}
          <div className="shrink-0 border-b bg-linear-to-b from-muted/30 to-transparent px-8 py-6">
            <input
              type="text"
              placeholder="Article title..."
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/40"
            />
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{readTime} min read</span>
              {article?.createdAt && (
                <>
                  <span>•</span>
                  <span>
                    Created {new Date(article.createdAt).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* MDX Editor - Full Height with sticky toolbar */}
          <div className="flex flex-1 flex-col min-h-0">
            <ForwardRefEditor
              ref={editorRef}
              markdown={article?.content ?? ""}
              onImageUpload={handleImageUpload}
              onImageInsertClick={() => setImageInsertDialogOpen(true)}
              onChange={() => setHasUnsavedChanges(true)}
            />
          </div>
        </div>

        {/* Right Sidebar - Metadata Panel */}
        <aside
          className={cn(
            "shrink-0 border-l bg-muted/20 transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "w-0 overflow-hidden" : "w-80",
          )}
        >
          <div className="flex h-full w-80 flex-col overflow-hidden">
            {/* Sidebar Header */}
            <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
              <h3 className="text-sm font-semibold">Article Settings</h3>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-lg"
                onClick={() => setSidebarCollapsed(true)}
              >
                <IconX className="size-3.5" />
              </Button>
            </div>

            {/* Sidebar Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6 p-4">
                {/* URL Slug */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <IconHash className="size-3.5" />
                    URL Slug
                  </Label>
                  <Input
                    placeholder="article-url-slug"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    disabled={mode === "edit"}
                    className="h-9 rounded-lg border-muted bg-background text-sm"
                  />
                  {slug && (
                    <p className="text-[11px] text-muted-foreground">
                      /articles/{slug}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Description */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <IconFileText className="size-3.5" />
                    Description
                  </Label>
                  <Textarea
                    placeholder="Brief description for SEO and previews..."
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    rows={3}
                    className="rounded-lg border-muted bg-background text-sm resize-none"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {description.length}/160 characters
                  </p>
                </div>

                <Separator />

                {/* Tags */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <IconTag className="size-3.5" />
                    Tags
                  </Label>
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
                      className="h-9 rounded-lg border-muted bg-background text-sm"
                    />
                    <Button
                      onClick={addTag}
                      size="icon"
                      variant="secondary"
                      className="size-9 shrink-0 rounded-lg"
                      disabled={!tagInput.trim()}
                    >
                      <IconPlus className="size-3.5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="h-6 gap-1 rounded-md bg-background px-2 text-[11px] font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-destructive hover:text-destructive-foreground"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <IconX className="size-2.5" />
                        </button>
                      </Badge>
                    ))}
                    {tags.length === 0 && (
                      <p className="text-[11px] italic text-muted-foreground">
                        No tags added
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Cover Image */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <IconPhoto className="size-3.5" />
                    Cover Image
                  </Label>
                  <CoverImageSelector
                    selectedImageUrl={coverImage}
                    onSelectImage={(image) => {
                      setCoverImage(image.url);
                      setHasUnsavedChanges(true);
                    }}
                  />
                </div>
              </div>
            </div>

            
          </div>
        </aside>
      </div>

      {/* Dialogs */}
      <ImageInsertDialog
        open={imageInsertDialogOpen}
        onClose={() => setImageInsertDialogOpen(false)}
        onSelect={handleImageInsert}
      />
    </div>
  );
}
