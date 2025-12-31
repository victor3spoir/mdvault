"use client";

import type { MDXEditorMethods } from "@mdxeditor/editor";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconEyeOff,
  IconPlus,
  IconSend,
  IconTrash,
  IconX,
  IconPhoto,
  IconTags,
  IconFileText,
  IconLoader2,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  createPostAction,
  deletePostAction,
  unpublishPostAction,
  updatePostAction,
} from "../posts.actions";
import type { Post, CreatePostInput } from "../posts.types";
import { ForwardRefEditor } from "./forward-ref-editor";

interface PostEditorProps {
  post?: Post;
  mode: "create" | "edit";
}

export function PostEditor({ post, mode }: PostEditorProps) {
  const router = useRouter();
  const editorRef = useRef<MDXEditorMethods>(null);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [imageInsertDialogOpen, setImageInsertDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);

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
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const content = editorRef.current?.getMarkdown() ?? "";
      const input: CreatePostInput = {
        title,
        slug,
        content,
        description,
        tags,
        coverImage,
        published: false,
      };

      if (mode === "create") {
        await createPostAction(input);
      } else if (post?.sha) {
        await updatePostAction(slug, { ...input, sha: post.sha });
      }

      toast.success("Post saved as draft");
      router.push("/cms/posts");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save post";
      toast.error(message);
      console.error("Error saving post:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Publish post
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const content = editorRef.current?.getMarkdown() ?? "";
      const input: CreatePostInput = {
        title,
        slug,
        content,
        description,
        tags,
        coverImage,
        published: true,
      };

      if (mode === "create") {
        await createPostAction(input);
      } else if (post?.sha) {
        await updatePostAction(slug, { ...input, sha: post.sha });
      }

      toast.success("Post published successfully");
      router.push("/cms/posts");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to publish post";
      toast.error(message);
      console.error("Error publishing post:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  // Delete post
  const handleDelete = async () => {
    if (!post?.sha) return;
    setIsDeleting(true);
    try {
      await deletePostAction(slug, post.sha);
      toast.success("Post deleted successfully");
      router.push("/cms/posts");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete post";
      toast.error(message);
      console.error("Error deleting post:", error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Unpublish post
  const handleUnpublish = async () => {
    if (!post?.sha) return;
    setIsUnpublishing(true);
    try {
      await unpublishPostAction(slug, post.sha);
      toast.success("Post unpublished successfully");
      router.refresh();
      setUnpublishDialogOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to unpublish post";
      toast.error(message);
      console.error("Error unpublishing post:", error);
    } finally {
      setIsUnpublishing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-10 max-w-7xl mx-auto w-full">
      {/* Actions Bar */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="h-11 w-11 rounded-2xl bg-muted/50 hover:bg-muted"
            size="icon"
          >
            <IconArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "create" ? "Create New Post" : "Edit Post"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "create" ? "Draft your next masterpiece" : `Editing: ${post?.title}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mode === "edit" && post?.published && (
            <Button
              variant="outline"
              onClick={() => setUnpublishDialogOpen(true)}
              disabled={isUnpublishing}
              className="h-11 rounded-2xl border-muted bg-muted/30 px-5 hover:bg-muted/50"
            >
              {isUnpublishing ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconEyeOff className="mr-2 size-4" />}
              Unpublish
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || !title || !slug}
            className="h-11 rounded-2xl border-muted bg-muted/30 px-5 hover:bg-muted/50"
          >
            {isSaving ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconDeviceFloppy className="mr-2 size-4" />}
            Save Draft
          </Button>

          {!post?.published && (
            <Button
              onClick={handlePublish}
              disabled={isPublishing || !title || !slug}
              className="h-11 rounded-2xl bg-primary px-6 shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95"
            >
              {isPublishing ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconSend className="mr-2 size-4" />}
              Publish
            </Button>
          )}

          {mode === "edit" && (
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting}
              size="icon"
              className="h-11 w-11 rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <IconTrash className="size-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Metadata Section: Title, Description, Cover Image, Slug, Tags */}
        <div className="rounded-3xl border bg-card/50 p-6 backdrop-blur-sm transition-all focus-within:border-primary/20 focus-within:shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
            {/* Left Column: Title & Description */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-semibold">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a catchy title..."
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="h-12 rounded-2xl border-muted bg-muted/30 px-4 text-lg font-bold transition-all focus-visible:ring-1 focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What is this post about? (SEO friendly description)"
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
                  Post Settings
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-[12px] font-medium text-muted-foreground">URL Slug</Label>
                  <Input
                    id="slug"
                    placeholder="post-url-slug"
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
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
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
                      <button type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 rounded-full p-0.5 transition-colors hover:bg-destructive hover:text-destructive-foreground"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <IconX className="size-3" />
                      </button>
                    </Badge>
                  ))}
                  {tags.length === 0 && (
                    <p className="text-[12px] text-muted-foreground italic">No tags added yet</p>
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
        <div className="space-y-6 rounded-3xl border bg-card/50 p-6 backdrop-blur-sm transition-all focus-within:border-primary/20 focus-within:shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Content</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImageInsertDialogOpen(true)}
                className="h-8 rounded-lg text-xs font-medium transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <IconPhoto className="mr-1.5 size-3.5" />
                Insert Image
              </Button>
            </div>
            <div className="min-h-150 rounded-2xl border border-muted bg-muted/30 overflow-hidden transition-all focus-within:border-primary/30">
              <ForwardRefEditor
                ref={editorRef}
                markdown={post?.content ?? ""}
                onImageUpload={handleImageUpload}
              />
            </div>
          </div>
        </div>
      </div>

      <ImageInsertDialog
        open={imageInsertDialogOpen}
        onClose={() => setImageInsertDialogOpen(false)}
        onSelect={handleImageInsert}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={unpublishDialogOpen} onOpenChange={setUnpublishDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the post back to drafts. It will no longer be visible
              on the public site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnpublish} className="rounded-2xl">
              Unpublish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
