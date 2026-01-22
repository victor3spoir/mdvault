import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

const statusFilters = ["all", "published", "draft"] as const;
const sortByOptions = ["date", "title"] as const;
const sortOrderOptions = ["asc", "desc"] as const;

export type StatusFilter = (typeof statusFilters)[number];
export type SortBy = (typeof sortByOptions)[number];
export type SortOrder = (typeof sortOrderOptions)[number];

export const articlesSearchParams = {
  q: parseAsString.withDefault(""),
  status: parseAsStringLiteral(statusFilters).withDefault("all"),
  sortBy: parseAsStringLiteral(sortByOptions).withDefault("date"),
  sortOrder: parseAsStringLiteral(sortOrderOptions).withDefault("desc"),
  tags: parseAsArrayOf(parseAsString).withDefault([]),
};

export const articlesSearchParamsCache =
  createSearchParamsCache(articlesSearchParams);
