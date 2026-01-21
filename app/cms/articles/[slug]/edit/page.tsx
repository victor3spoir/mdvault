import { notFound } from "next/navigation";
import { getArticleAction } from "@/features/articles/articles.actions";
import { ArticleEditorLayout } from "@/features/articles/components/article-editor-layout";

interface EditArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditArticlePage({
  params,
}: EditArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleAction(slug);

  if (!article) {
    notFound();
  }

  return <ArticleEditorLayout article={article} mode="edit" />;
}
