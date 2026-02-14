import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostsList } from "@/features/posts/components/posts-list";
import { listPostsAction } from "@/features/posts/posts.actions";
import PageLayout from "@/features/shared/components/page-layout";

export default async function Page() {
  const postResults = await listPostsAction();

  if (!postResults.success) {
    return <div>Error loading posts</div>;
  }

  const posts = postResults.data;

  return (
    <PageLayout
      title="Posts"
      description="Manage your LinkedIn-style posts."
      breadcrumbs={[{ label: "Dashboard", href: "/cms" }, { label: "Posts" }]}
      actions={
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="hidden h-6 rounded-lg px-2 text-xs font-bold sm:flex"
          >
            {posts.length} Posts
          </Badge>
          <Button asChild className="gap-2 rounded-xl">
            <Link href="/cms/posts/new">
              <IconPlus className="size-4" />
              New Post
            </Link>
          </Button>
        </div>
      }
    >
      <PostsList posts={posts} />
    </PageLayout>
  );
}
