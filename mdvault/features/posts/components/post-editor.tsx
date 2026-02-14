"use client";

import { IconLanguage, IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { listArticlesAction } from "@/features/articles/articles.actions";
import type { Article } from "@/features/articles/articles.types";
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
  const [lang, setLang] = useState<"fr" | "en">(post?.lang || "fr");
  const [article, setArticle] = useState(post?.article || "");
  const [coverImage, setCoverImage] = useState(post?.coverImage || "");
  const [author, setAuthor] = useState(post?.author || "");
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    listArticlesAction().then((result) => {
      if (result.success) {
        setArticles(result.data);
      }
    });
  }, []);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    startTransition(async () => {
      const input = {
        title,
        content,
        lang,
        article: article || undefined,
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
        <Label htmlFor="lang" className="flex items-center gap-2">
          <IconLanguage className="size-4" />
          Language
        </Label>
        <Select value={lang} onValueChange={(value) => setLang(value as "fr" | "en")}>
          <SelectTrigger id="lang" className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fr">Français</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
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
        <Label htmlFor="article">Related Article (Optional)</Label>
        <div className="mt-2">
          <Combobox
            value={article}
            onValueChange={(value) => setArticle(value as string)}
          >
            <ComboboxInput
              placeholder="Select an article..."
              showClear={!!article}
            />
            <ComboboxContent>
              <ComboboxList>
                <ComboboxEmpty>No articles found</ComboboxEmpty>
                {articles.map((a) => (
                  <ComboboxItem key={a.id} value={a.id}>
                    {a.title}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
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
