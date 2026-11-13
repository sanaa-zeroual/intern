import api from './api';
import type {
  ArticleStockSummary,
  StockKpi,
  StockMovement,
  PreviewExitResponse,
  CreateStockEntryData,
  CreateStockExitData,
  StockNotification,
} from '../types/stock.types';

export async function getStockSummaries(params: {
  search?: string;
  provenance?: string;
  statut?: string;
  type?: string;
} = {}): Promise<ArticleStockSummary[]> {
  const response = await api.get<ArticleStockSummary[]>('/stock', { params });
  return response.data;
}

export async function getStockKpi(): Promise<StockKpi> {
  const response = await api.get<StockKpi>('/stock/kpi');
  return response.data;
}

export async function getStockMovements(article_id?: string): Promise<StockMovement[]> {
  const response = await api.get<StockMovement[]>('/stock/movements', {
    params: article_id ? { article_id } : {},
  });
  return response.data;
}

export async function previewStockExit(
  article_id: string,
  quantite: number
): Promise<PreviewExitResponse> {
  const response = await api.post<PreviewExitResponse>('/stock/preview-exit', {
    article_id,
    quantite,
  });
  return response.data;
}

export async function recordStockEntry(data: CreateStockEntryData): Promise<any> {
  const response = await api.post('/stock/entry', data);
  return response.data;
}

export async function recordStockExit(data: CreateStockExitData): Promise<any> {
  const response = await api.post('/stock/exit', data);
  return response.data;
}

export async function getStockNotifications(): Promise<StockNotification[]> {
  const response = await api.get<StockNotification[]>('/stock/notifications');
  return response.data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/stock/notifications/${id}/read`);
}
