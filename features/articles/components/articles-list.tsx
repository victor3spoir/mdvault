"use client";

import {
  IconFileText,
} from "@tabler/icons-react";
import { useQueryStates } from "nuqs";
import { useMemo, useState, useTransition } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import type { Article } from "@/features/articles/articles.types";
import {
  ArticleCard,
  ArticleCardSkeleton,
} from "@/features/articles/components/article-card";
import {
  articlesSearchParams,
} from "../articles.search-params";
import ArticleSearchBar from "./article-search-bar";

interface ArticlesListProps {
  initialArticles: Article[];
}

export function ArticlesList({ initialArticles }: ArticlesListProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [isPending, startTransition] = useTransition();

  const [params, setParams] = useQueryStates(articlesSearchParams, {
    shallow: false,
    startTransition,
  });

  const {
    searchQuery: searchQuery,
    status: statusFilter,
    sortBy,
    sortOrder,
    tags: selectedTags,
  } = params;

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const article of articles) {
      if (article.tags) {
        for (const tag of article.tags) {
          tags.add(tag);
        }
      }
    }
    return Array.from(tags).sort();
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles
      .filter((article) => {
        const matchesSearch =
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          article.tags?.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase()),
          );

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "published"
            ? article.published
            : !article.published);

        const matchesTags =
          selectedTags.length === 0 ||
          (article.tags &&
            selectedTags.some((tag) => article.tags?.includes(tag)));

        return matchesSearch && matchesStatus && matchesTags;
      })
      .sort((a, b) => {
        const modifier = sortOrder === "asc" ? 1 : -1;
        if (sortBy === "date") {
          return (
            (new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()) *
            modifier
          );
        }
        return a.title.localeCompare(b.title) * modifier;
      });
  }, [articles, searchQuery, statusFilter, selectedTags, sortBy, sortOrder]);

  const handleDelete = (deletedArticle: Article) => {
    setArticles((prev) => prev.filter((p) => p.slug !== deletedArticle.slug));
  };



  return (
    <div className="flex w-full flex-col gap-8">
      <ArticleSearchBar allTags={allTags} />

      {isPending ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] gap-6">
          {["s1", "s2", "s3", "s4", "s5", "s6"].map((key) => (
            <ArticleCardSkeleton key={key} />
          ))}
        </div>
      ) : filteredArticles.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] gap-6">
          {filteredArticles.map((article) => (
            <ArticleCard
              key={article.slug}
              article={article}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-100 items-center justify-center rounded-3xl border border-dashed bg-muted/30">
          <EmptyState
            icon={<IconFileText className="size-6" />}
            title={
              searchQuery || selectedTags.length > 0
                ? "No posts found"
                : "No posts yet"
            }
            description={
              searchQuery || selectedTags.length > 0
                ? "Try adjusting your filters or search query to find what you're looking for."
                : "Start by creating your first article to share with the world."
            }
            action={
              !(searchQuery || selectedTags.length > 0)
                ? { label: "Create Article", href: "/cms/articles/new" }
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
