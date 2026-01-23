import type { SearchParams } from "nuqs/server";
import { listArticlesAction } from "@/features/articles/articles.actions";
import { articlesSearchParamsCache, loadArticlesFilteringParams } from "@/features/articles/articles.search-params";
import { ArticlesList } from "@/features/articles/components/articles-list";

interface ArticlesPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function Page({
  searchParams,
}: ArticlesPageProps) {
  await articlesSearchParamsCache.parse(searchParams);
  await loadArticlesFilteringParams(searchParams)
  const result = await listArticlesAction();
  const articles = result.success ? result.data : [];

  return <ArticlesList initialArticles={articles} />;
}
