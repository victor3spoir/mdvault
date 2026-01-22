"use client";

import {
  IconCalendar,
  IconFileText,
  IconFilter,
  IconPlus,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { useQueryStates } from "nuqs";
import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Article } from "@/features/articles/articles.types";
import {
  ArticleCard,
  ArticleCardSkeleton,
} from "@/features/articles/components/article-card";
import PageLayout from "@/features/shared/components/page-layout";
import {
  articlesSearchParams,
  type SortBy,
  type SortOrder,
  type StatusFilter,
} from "../articles.search-params";

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
    q: searchQuery,
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

  const handlePublishChange = (updatedArticle: Article) => {
    setArticles((prev) =>
      prev.map((p) => (p.slug === updatedArticle.slug ? updatedArticle : p)),
    );
  };

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setParams({ tags: newTags });
  };

  return (
    <PageLayout
      title="Articles"
      description="Manage your content, drafts, and published articles."
      breadcrumbs={[
        { label: "Dashboard", href: "/cms" },
        { label: "Articles" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="hidden h-6 rounded-lg px-2 text-xs font-bold sm:flex"
          >
            {articles.length} Articles
          </Badge>
          <Button
            asChild
            size="sm"
            className="h-8 rounded-lg px-3 shadow-sm transition-all hover:shadow-md active:scale-95"
          >
            <Link href="/cms/articles/new" className="gap-2">
              <IconPlus className="size-4" />
              <span className="hidden sm:inline">Create Article</span>
            </Link>
          </Button>
        </div>
      }
    >
      <div className="flex w-full flex-col gap-8 p-6 lg:p-10">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 rounded-3xl border bg-card/50 p-4 backdrop-blur-sm sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search articles by title, tags or description..."
                value={searchQuery}
                onChange={(e) => setParams({ q: e.target.value })}
                className="h-11 rounded-2xl border-none bg-muted/50 pl-11 focus-visible:ring-1 focus-visible:ring-primary/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={statusFilter}
                onValueChange={(value: StatusFilter) =>
                  setParams({ status: value })
                }
              >
                <SelectTrigger className="h-11 w-35 rounded-2xl border-none bg-muted/50 focus:ring-1 focus:ring-primary/20">
                  <div className="flex items-center gap-2">
                    <IconFilter className="size-4 text-muted-foreground" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-muted">
                  <SelectItem value="all" className="rounded-xl">
                    All Status
                  </SelectItem>
                  <SelectItem value="published" className="rounded-xl">
                    Published
                  </SelectItem>
                  <SelectItem value="draft" className="rounded-xl">
                    Drafts
                  </SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-2xl bg-muted/50 hover:bg-muted"
                  >
                    {sortOrder === "asc" ? (
                      <IconSortAscending className="size-5" />
                    ) : (
                      <IconSortDescending className="size-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-2xl border-muted"
                >
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Sort by
                  </div>
                  <DropdownMenuItem
                    onClick={() => setParams({ sortBy: "date" as SortBy })}
                    className="gap-2 rounded-xl"
                  >
                    <IconCalendar className="size-4" /> Date
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setParams({ sortBy: "title" as SortBy })}
                    className="gap-2 rounded-xl"
                  >
                    <IconFileText className="size-4" /> Title
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Order
                  </div>
                  <DropdownMenuItem
                    onClick={() => setParams({ sortOrder: "asc" as SortOrder })}
                    className="gap-2 rounded-xl"
                  >
                    <IconSortAscending className="size-4" /> Ascending
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setParams({ sortOrder: "desc" as SortOrder })
                    }
                    className="gap-2 rounded-xl"
                  >
                    <IconSortDescending className="size-4" /> Descending
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer rounded-lg px-3 py-1 transition-all hover:bg-primary/10 hover:text-primary"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  {selectedTags.includes(tag) && (
                    <IconX className="ml-1.5 size-3" />
                  )}
                </Badge>
              ))}
            </div>
          )}
        </div>

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
                onPublishChange={handlePublishChange}
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
    </PageLayout>
  );
}
