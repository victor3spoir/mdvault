import { PostEditor } from "@/features/posts/components/post-editor";
import { getPostAction } from "@/features/posts/posts.actions";
import PageLayout from "@/features/shared/components/page-layout";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const postResult = await getPostAction(id);

  if (!postResult.success) {
    return <div>Post not found</div>;
  }

  const post = postResult.data;

  return (
    <PageLayout
      title={`Edit: ${post.title}`}
      description="Edit your post."
      breadcrumbs={[
        { label: "Dashboard", href: "/cms" },
        { label: "Posts", href: "/cms/posts" },
        { label: post.title },
      ]}
    >
      <div className="max-w-2xl">
        <PostEditor post={post} />
      </div>
    </PageLayout>
  );
}
