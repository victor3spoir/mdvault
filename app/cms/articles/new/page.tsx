import { PostEditor } from "@/features/articles/components/article-editor";
import PageLayout from "@/features/shared/components/page-layout";

export default function NewPostPage() {
  return (
    <PageLayout
      title="Create New Article"
      description="Write and publish a new blog article"
      breadcrumbs={[
        { label: "Dashboard", href: "/cms" },
        { label: "Posts", href: "/cms/articles" },
        { label: "New Article" },
      ]}
    >
      <PostEditor mode="create" />
    </PageLayout>
  );
}
