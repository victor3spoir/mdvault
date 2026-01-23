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
  const result = await getArticleAction(slug);
  
  if (!result.success || !result.data) {
    notFound();
  }

  return <ArticleEditorLayout article={result.data} mode="edit" />;
}
