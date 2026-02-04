"use client";

import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CoverImageSelector } from "@/features/medias/components/cover-image-selector";
import type { MediaFile } from "@/features/medias/medias.types";
import {
  createPostAction,
  updatePostAction,
} from "@/features/posts/posts.actions";
import type { Post } from "@/features/posts/posts.types";

interface PostEditorProps {
  post?: Post;
}

export function PostEditor({ post }: PostEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [link, setLink] = useState(post?.link || "");
  const [coverImage, setCoverImage] = useState(post?.coverImage || "");
  const [author, setAuthor] = useState(post?.author || "");

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    startTransition(async () => {
      const input = {
        title,
        content,
        link: link || undefined,
        coverImage: coverImage || undefined,
        author: author || undefined,
        published: false,
      };

      const result = post
        ? await updatePostAction(post.id, {
            ...input,
            sha: post.sha!,
            createdAt: post.createdAt,
          })
        : await createPostAction(input);

      if (result.success) {
        toast.success(post ? "Post updated" : "Post created");
        router.push("/cms/posts");
      } else {
        toast.error(result.error || "Failed to save post");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Post title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="author">Author (Optional)</Label>
        <Input
          id="author"
          placeholder="Your name..."
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          placeholder="Write your post here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-2 min-h-64"
        />
      </div>

      <div>
        <Label htmlFor="link">Link (Optional)</Label>
        <Input
          id="link"
          type="url"
          placeholder="https://example.com"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="cover">Cover Image</Label>
        <div className="mt-2">
          <CoverImageSelector
            selectedImageUrl={coverImage}
            onSelectImage={(image: MediaFile) => setCoverImage(image.url)}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={handleSave} disabled={isPending} className="gap-2">
          <IconPlus className="size-4" />
          {isPending ? "Saving..." : post ? "Update Post" : "Create Post"}
        </Button>
      </div>
    </div>
  );
}
