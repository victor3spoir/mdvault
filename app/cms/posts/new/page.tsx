import { PostEditor } from "@/features/posts/components/post-editor";
import PageLayout from "@/features/shared/components/page-layout";

export default function NewPostPage() {
  return (
    <PageLayout
      title="Create New Post"
      description="Write and publish a new blog post"
      breadcrumbs={[
        { label: "Dashboard", href: "/cms" },
        { label: "Posts", href: "/cms/posts" },
        { label: "New Post" },
      ]}
    >
      <PostEditor mode="create" />
    </PageLayout>
  );
}
