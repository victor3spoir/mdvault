import { notFound } from "next/navigation";
import { PostEditor } from "@/features/posts/components/post-editor";
import { getPostAction } from "@/features/posts/posts.actions";
import PageLayout from "@/features/shared/components/page-layout";

interface EditPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { slug } = await params;
  const post = await getPostAction(slug);

  if (!post) {
    notFound();
  }

  return (
    <PageLayout
      title={`Edit: ${post.title}`}
      description="Make changes to your post"
      breadcrumbs={[
        { label: "Dashboard", href: "/cms" },
        { label: "Posts", href: "/cms/posts" },
        { label: post.title, href: `/cms/posts/${slug}` },
        { label: "Edit" },
      ]}
    >
      <PostEditor post={post} mode="edit" />
    </PageLayout>
  );
}
