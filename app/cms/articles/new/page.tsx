import { ArticleEditor } from "@/features/articles/components/article-editor";

export default function NewArticlePage() {
  return (
    <div className="h-screen max-h-[100%] overflow-y-hidden">
      <ArticleEditor mode="create" />
    </div>
  );
}
