import { notFound } from "next/navigation";
import { getArticleAction } from "@/features/articles/articles.actions";
import { ArticleEditor } from "@/features/articles/components/article-editor";

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: Readonly<EditArticlePageProps>) {
  const { id } = await params;
  const result = await getArticleAction(id);

  if (!result.success) {
    notFound();
  }

  return (
    <div className="max-h-full overflow-y-hidden">
      <ArticleEditor mode="edit" article={result.data} />
    </div>
  )
}
