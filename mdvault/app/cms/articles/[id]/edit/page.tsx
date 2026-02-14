import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getArticleAction } from "@/features/articles/articles.actions";
import { ArticleEditor } from "@/features/articles/components/article-editor";

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

async function ArticleEditorWrapper({ params }: EditArticlePageProps) {
  const { id } = await params;
  const result = await getArticleAction(id);

  if (!result.success) {
    notFound();
  }

  return <ArticleEditor mode="edit" article={result.data} />;
}

export default function EditArticlePage({
  params,
}: Readonly<EditArticlePageProps>) {
  return (
    <div className="max-h-full overflow-y-hidden">
      <Suspense fallback={<div className="p-8">Loading article...</div>}>
        <ArticleEditorWrapper params={params} />
      </Suspense>
    </div>
  );
}
