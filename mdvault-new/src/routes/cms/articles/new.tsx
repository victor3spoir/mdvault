import { createFileRoute } from "@tanstack/react-router";
import { ArticleEditor } from "#/features/articles/components/article-editor";

export const Route = createFileRoute("/cms/articles/new")({
	component: NewArticlePage,
});

function NewArticlePage() {
	return <ArticleEditor mode="create" />;
}
