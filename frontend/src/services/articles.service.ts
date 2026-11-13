import api from "./api";

import type {
  Article,
  ArticleFilters,
  CreateArticleData,
} from "../types/article.types";

export async function getArticles(
  filters: ArticleFilters = {}
): Promise<Article[]> {
  const response = await api.get<Article[]>("/articles", {
    params: filters,
  });

  return response.data;
}

export async function getArticleById(
  id: string
): Promise<Article> {
  const response = await api.get<Article>(
    `/articles/${id}`
  );

  return response.data;
}

export async function createArticle(
  data: CreateArticleData
): Promise<Article> {
  const response = await api.post<Article>(
    "/articles",
    data
  );

  return response.data;
}

export async function updateArticle(
  id: string,
  data: Partial<CreateArticleData>
): Promise<Article> {
  const response = await api.patch<Article>(
    `/articles/${id}`,
    data
  );

  return response.data;
}

export async function archiveArticle(
  id: string
): Promise<void> {
  await api.patch(`/articles/${id}/archive`);
}

export async function checkArticleDuplicates(
  data: Partial<CreateArticleData>
): Promise<Article[]> {
  const response = await api.post<Article[]>(
    "/articles/check-duplicates",
    data
  );

  return response.data;
}


import type { PriceHistory, UpdatePriceData } from "../types/article.types";

export async function updateArticlePrice(
  id: string,
  data: UpdatePriceData
): Promise<{ article: Article; priceHistory: PriceHistory }> {
  const response = await api.patch<{ article: Article; priceHistory: PriceHistory }>(
    `/articles/${id}/price`,
    data
  );
  return response.data;
}

export async function getPriceHistory(id: string): Promise<PriceHistory[]> {
  const response = await api.get<PriceHistory[]>(`/articles/${id}/price-history`);
  return response.data;
}

export async function getPendingValuationArticles(): Promise<Article[]> {
  const response = await api.get<Article[]>("/articles/pending-valuation");
  return response.data;
}
