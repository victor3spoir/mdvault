import {
  IconFileText,
  IconFilter,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PostCard } from "@/features/posts/components/post-card";
import { listPostsAction } from "@/features/posts/posts.actions";
import PageLayout from "@/features/shared/components/page-layout";

export default async function PostsPage() {
  const posts = await listPostsAction();

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
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search posts..." className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <IconFilter className="size-4" />
            Filter
          </Button>
          <Badge variant="secondary">{posts.length} posts</Badge>
        </div>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
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
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] ">
          {posts.map((post) => (
            <PostCard post={post} key={post.slug} />
          ))}
        </div>
      )}
    </PageLayout>
  );
}
