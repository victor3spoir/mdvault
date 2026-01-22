import type { SearchParams } from "nuqs/server";
import { listArticlesAction } from "@/features/articles/articles.actions";
import { articlesSearchParamsCache } from "@/features/articles/articles.search-params";
import { ArticlesList } from "@/features/articles/components/articles-list";

interface ArticlesPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ArticlesPage({
  searchParams,
}: ArticlesPageProps) {
  await articlesSearchParamsCache.parse(searchParams);
  const articles = await listArticlesAction();

  return <ArticlesList initialArticles={articles} />;
}
