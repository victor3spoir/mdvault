"use client";

import type { MDXEditorMethods } from "@mdxeditor/editor";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { MediaFile } from "@/features/medias/medias.types";
import { ImageInsertDialog } from "../../medias/components/image-insert-dialog";
import { uploadImageAction } from "../../medias/medias.actions";
import { createArticleAction, updateArticleAction } from "../articles.actions";
import { ARTICLE_MESSAGES, ARTICLE_ROUTES } from "../articles.constants";
import type { Article, CreateArticleInput } from "../articles.types";
import { getContentStats } from "../articles.utils";
import { ArticleEditorHeader } from "./article-editor-header";
import { ArticleEditorSettingsSidebar } from "./article-editor-settings-sidebar";
import { ForwardRefEditor } from "./forward-ref-editor";

interface ArticleEditorLayoutProps {
  article?: Article;
  mode: "create" | "edit";
}

interface EditorUIState {
  imageInsertDialogOpen: boolean;
  hasUnsavedChanges: boolean;
  sidebarCollapsed: boolean;
}

export function ArticleEditor({ article, mode }: ArticleEditorLayoutProps) {
  const router = useRouter();
  const editorRef = useRef<MDXEditorMethods>(null);
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(article?.title ?? "");
  const [lang, setLang] = useState<"fr" | "en">(article?.lang ?? "en");
  const [description, setDescription] = useState(article?.description ?? "");
  const [tags, setTags] = useState<string[]>(article?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState(article?.coverImage ?? "");

  const [uiState, setUiState] = useState<EditorUIState>({
    imageInsertDialogOpen: false,
    hasUnsavedChanges: false,
    sidebarCollapsed: false,
  });

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setUiState((prev) => ({ ...prev, hasUnsavedChanges: true }));
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
      setUiState((prev) => ({ ...prev, hasUnsavedChanges: true }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
    setUiState((prev) => ({ ...prev, hasUnsavedChanges: true }));
  };

  // Image upload handler for MDXEditor
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const result = await uploadImageAction(file);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data.url;
  }, []);

  const handleImageInsert = (image: MediaFile) => {
    if (editorRef.current) {
      editorRef.current.insertMarkdown(`![image](${image.url})`);
    }
    setUiState((prev) => ({ ...prev, imageInsertDialogOpen: false }));
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const content = editorRef.current?.getMarkdown() ?? "";
        const input: CreateArticleInput = {
          title,
          lang,
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
          result = await updateArticleAction(article.id, {
            ...input,
            sha: article.sha,
          });
        } else {
          throw new Error("Failed to save article");
        }

        if (!result.success) {
          throw new Error(result.error);
        }

        setUiState((prev) => ({ ...prev, hasUnsavedChanges: false }));
        toast.success(ARTICLE_MESSAGES.SAVE_SUCCESS, {
          description: ARTICLE_MESSAGES.SAVE_SUCCESS_DESC,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : ARTICLE_MESSAGES.SAVE_ERROR;
        toast.error(message);
        console.error("Error saving article:", error);
      }
    });
  };

  const handlePublish = () => {
    startTransition(async () => {
      try {
        const content = editorRef.current?.getMarkdown() ?? "";
        const input: CreateArticleInput = {
          title,
          lang,
          content,
          description,
          tags,
          coverImage,
          published: true,
        };

        if (mode === "create") {
          await createArticleAction(input);
        } else if (article?.sha) {
          await updateArticleAction(article.id, { ...input, sha: article.sha });
        }

        toast.success(ARTICLE_MESSAGES.PUBLISH_SUCCESS, {
          description: ARTICLE_MESSAGES.PUBLISH_SUCCESS_DESC,
        });
        router.push(ARTICLE_ROUTES.LIST);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : ARTICLE_MESSAGES.PUBLISH_ERROR;
        toast.error(message);
        console.error("Error publishing article:", error);
      }
    });
  };

  // Content stats - computed on each render (refs don't trigger re-renders)
  const content = editorRef.current?.getMarkdown() ?? "";
  const { wordCount, readTime } = getContentStats(content);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top Navigation Bar */}
      <ArticleEditorHeader
        title={title}
        id={article?.id}
        mode={mode}
        article={article}
        isSaving={isPending}
        isPublishing={isPending}
        hasUnsavedChanges={uiState.hasUnsavedChanges}
        sidebarCollapsed={uiState.sidebarCollapsed}
        onSave={handleSave}
        onPublish={handlePublish}
        onToggleSidebar={() =>
          setUiState((prev) => ({
            ...prev,
            sidebarCollapsed: !prev.sidebarCollapsed,
          }))
        }
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
              onImageInsertClick={() =>
                setUiState((prev) => ({ ...prev, imageInsertDialogOpen: true }))
              }
              onChange={() =>
                setUiState((prev) => ({ ...prev, hasUnsavedChanges: true }))
              }
            />
          </div>
        </div>

        {/* Right Sidebar - Metadata Panel */}
        <ArticleEditorSettingsSidebar
          lang={lang}
          description={description}
          tags={tags}
          tagInput={tagInput}
          coverImage={coverImage}
          collapsed={uiState.sidebarCollapsed}
          onLangChange={(value) => {
            setLang(value);
            setUiState((prev) => ({ ...prev, hasUnsavedChanges: true }));
          }}
          onDescriptionChange={(value) => {
            setDescription(value);
            setUiState((prev) => ({ ...prev, hasUnsavedChanges: true }));
          }}
          onTagInputChange={setTagInput}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          onCoverImageChange={(url) => {
            setCoverImage(url);
            setUiState((prev) => ({ ...prev, hasUnsavedChanges: true }));
          }}
          onCollapse={() =>
            setUiState((prev) => ({ ...prev, sidebarCollapsed: true }))
          }
        />
      </div>

      <ImageInsertDialog
        open={uiState.imageInsertDialogOpen}
        onClose={() =>
          setUiState((prev) => ({ ...prev, imageInsertDialogOpen: false }))
        }
        onSelect={handleImageInsert}
      />
    </div>
  );
}
