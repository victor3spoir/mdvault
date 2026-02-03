"use client";

import type { MDXEditorMethods } from "@mdxeditor/editor";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { MediaFile } from "@/features/medias/medias.types";
import { ImageInsertDialog } from "../../medias/components/image-insert-dialog";
import { uploadImageAction } from "../../medias/medias.actions";
import {
  createArticleAction,
  updateArticleAction,
} from "../articles.actions";
import {
  ARTICLE_MESSAGES,
  ARTICLE_ROUTES,
} from "../articles.constants";
import type { Article, CreateArticleInput } from "../articles.types";
import { getContentStats } from "../articles.utils";
import { ArticleEditorHeader } from "./article-editor-header";
import { ArticleEditorSettingsSidebar } from "./article-editor-settings-sidebar";
import { ForwardRefEditor } from "./forward-ref-editor";

interface ArticleEditorLayoutProps {
  article?: Article;
  mode: "create" | "edit";
}

export function ArticleEditor({
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
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data.url;
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

      let result: Awaited<ReturnType<typeof createArticleAction>>;
      if (mode === "create") {
        result = await createArticleAction(input);
      } else if (article?.sha) {
        result = await updateArticleAction(slug, { ...input, sha: article.sha });
      } else {
        throw new Error("Failed to save article");
      }

      if (!result.success) {
        throw new Error(result.error);
      }

      setHasUnsavedChanges(false);
      toast.success(ARTICLE_MESSAGES.SAVE_SUCCESS, {
        description: ARTICLE_MESSAGES.SAVE_SUCCESS_DESC,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ARTICLE_MESSAGES.SAVE_ERROR;
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

      toast.success(ARTICLE_MESSAGES.PUBLISH_SUCCESS, {
        description: ARTICLE_MESSAGES.PUBLISH_SUCCESS_DESC,
      });
      router.push(ARTICLE_ROUTES.LIST);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ARTICLE_MESSAGES.PUBLISH_ERROR;
      toast.error(message);
      console.error("Error publishing article:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  // Content stats - computed on each render (refs don't trigger re-renders)
  const content = editorRef.current?.getMarkdown() ?? "";
  const { wordCount, readTime } = getContentStats(content);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top Navigation Bar */}
      <ArticleEditorHeader
        title={title}
        slug={slug}
        mode={mode}
        article={article}
        isSaving={isSaving}
        isPublishing={isPublishing}
        hasUnsavedChanges={hasUnsavedChanges}
        sidebarCollapsed={sidebarCollapsed}
        onSave={handleSave}
        onPublish={handlePublish}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

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
          <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
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
        <ArticleEditorSettingsSidebar
          slug={slug}
          description={description}
          tags={tags}
          tagInput={tagInput}
          coverImage={coverImage}
          mode={mode}
          collapsed={sidebarCollapsed}
          onSlugChange={(value) => {
            setSlug(value);
            setHasUnsavedChanges(true);
          }}
          onDescriptionChange={(value) => {
            setDescription(value);
            setHasUnsavedChanges(true);
          }}
          onTagInputChange={setTagInput}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          onCoverImageChange={(url) => {
            setCoverImage(url);
            setHasUnsavedChanges(true);
          }}
          onCollapse={() => setSidebarCollapsed(true)}
        />
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
