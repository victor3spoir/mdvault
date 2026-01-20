import { notFound } from "next/navigation";
import { getArticleAction } from "@/features/articles/articles.actions";
import { PostEditor } from "@/features/articles/components/article-editor";
import PageLayout from "@/features/shared/components/page-layout";

interface EditPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { slug } = await params;
  const article = await getArticleAction(slug);

  if (!article) {
    notFound();
  }

  return (
    <PageLayout
      title={`Edit: ${article.title}`}
      description="Make changes to your article"
      breadcrumbs={[
        { label: "Dashboard", href: "/cms" },
        { label: "Posts", href: "/cms/articles" },
        { label: article.title, href: `/cms/articles/${slug}` },
        { label: "Edit" },
      ]}
    >
      <PostEditor article={article} mode="edit" />
    </PageLayout>
  );
}
