"use client";

import { IconFileText } from "@tabler/icons-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PostCard } from "@/features/posts/components/post-card";
import type { Post } from "@/features/posts/posts.types";

interface PostsListProps {
  posts: Post[];
}

export function PostsList({ posts }: PostsListProps) {
  return (
    <div className="flex w-full flex-col gap-8">
      {posts.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-6">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-100 items-center justify-center rounded-3xl border border-dashed bg-muted/30">
          <EmptyState
            icon={<IconFileText className="size-6" />}
            title="No posts found"
            description="Create your first LinkedIn-style post to get started."
          />
        </div>
      )}
    </div>
  );
}
