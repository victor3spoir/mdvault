import { PostEditor } from "@/features/posts/components/post-editor";
import PageLayout from "@/features/shared/components/page-layout";

export default function Page() {
  return (
    <PageLayout
      title="New Post"
      description="Create a new LinkedIn-style post."
      breadcrumbs={[
        { label: "Dashboard", href: "/cms" },
        { label: "Posts", href: "/cms/posts" },
        { label: "New" },
      ]}
    >
      <div className="max-w-2xl">
        <PostEditor />
      </div>
    </PageLayout>
  );
}
