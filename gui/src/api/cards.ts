import apiClient from './client';
import type { Card, CardCreate, CardUpdate, SearchResponse } from '../types';

export async function listCards(skip = 0, limit = 20): Promise<Card[]> {
  const { data } = await apiClient.get<Card[]>('/cards/', { params: { skip, limit } });
  return data;
}

export async function getCard(id: string): Promise<Card> {
  const { data } = await apiClient.get<Card>(`/cards/${id}`);
  return data;
}

export async function createCard(card: CardCreate): Promise<Card> {
  const { data } = await apiClient.post<Card>('/cards/', card);
  return data;
}

export async function updateCard(id: string, card: CardUpdate): Promise<Card> {
  const { data } = await apiClient.put<Card>(`/cards/${id}`, card);
  return data;
}

export async function deleteCard(id: string): Promise<void> {
  await apiClient.delete(`/cards/${id}`);
}

export async function searchCards(query: string, cursor?: string, limit = 10): Promise<SearchResponse> {
  const { data } = await apiClient.get<SearchResponse>('/search/cards', {
    params: { query, cursor, limit },
  });
  return data;
}
