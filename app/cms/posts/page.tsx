"use client";

import {
  IconFileText,
  IconPlus,
  IconSearch,
  IconX,
  IconCheck,
} from "@tabler/icons-react";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PostCard } from "@/features/posts/components/post-card";
import type { Post } from "@/features/posts/posts.types";
import PageLayout from "@/features/shared/components/page-layout";
import { listPostsAction } from "@/features/posts/posts.actions";

type StatusFilter = "all" | "published" | "draft";

export default function PostsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load posts on mount
  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      try {
        const fetchedPosts = await listPostsAction();
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPosts();
  }, []);

  // Get all unique tags for filter
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach((post) => {
      post.tags?.forEach((tag) => {
        tags.add(tag);
      });
    });
    return Array.from(tags).sort();
  }, [posts]);

  // Filter and search posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Search filter (title, description, content)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        post.title.toLowerCase().includes(searchLower) ||
        post.description?.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower);

      // Status filter
      let matchesStatus = true;
      if (statusFilter === "published") {
        matchesStatus = post.published;
      } else if (statusFilter === "draft") {
        matchesStatus = !post.published;
      }

      // Tags filter
      const matchesTags =
        selectedTags.length === 0 ||
        (post.tags &&
          selectedTags.some((tag) => post.tags?.includes(tag)));

      return matchesSearch && matchesStatus && matchesTags;
    });
  }, [posts, searchQuery, statusFilter, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSelectedTags([]);
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || selectedTags.length > 0;

  return (
    <PageLayout
      title="Posts"
      description="Manage your blog posts and articles"
      breadcrumbs={[{ label: "Dashboard", href: "/cms" }, { label: "Posts" }]}
      actions={
        <Button asChild className="gap-2">
          <Link href="/cms/posts/new">
            <IconPlus className="size-4" />
            New Post
          </Link>
        </Button>
      }
    >
      {/* Search Bar */}
      <div className="relative max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search posts by title, description, or content..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Status Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("all")}
        >
          All
        </Button>
        <Button
          variant={statusFilter === "published" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("published")}
          className="gap-2"
        >
          <IconCheck className="size-4" />
          Published
        </Button>
        <Button
          variant={statusFilter === "draft" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("draft")}
          className="gap-2"
        >
          <IconFileText className="size-4" />
          Draft
        </Button>
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Filter by tags:</p>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Filter Status */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          {filteredPosts.length} of {posts.length} posts
        </Badge>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-2">
            <IconX className="size-4" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))]">
          {Array.from({ length: 6 }, () => `skeleton-${Math.random()}`).map((id) => (
            <div
              key={id}
              className="h-48 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : filteredPosts.length === 0 && posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <IconFileText className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No posts yet</h3>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            Get started by creating your first post. You can write in Markdown
            with full support for images, tables, and code blocks.
          </p>
          <Button asChild>
            <Link href="/cms/posts/new">Create First Post</Link>
          </Button>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <IconSearch className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No posts match your filters</h3>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            Try adjusting your search query or filters to find what you're looking for.
          </p>
          <Button variant="outline" onClick={resetFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))]">
          {filteredPosts.map((post) => (
            <PostCard post={post} key={post.slug} />
          ))}
        </div>
      )}
    </PageLayout>
  );
}
