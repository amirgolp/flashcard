import apiClient from './client';
import type { Deck, DeckCreate, DeckUpdate } from '../types';

export async function listDecks(skip = 0, limit = 20): Promise<Deck[]> {
  const { data } = await apiClient.get<Deck[]>('/decks/', { params: { skip, limit } });
  return data;
}

export async function getDeck(id: string): Promise<Deck> {
  const { data } = await apiClient.get<Deck>(`/decks/${id}`);
  return data;
}

export async function createDeck(deck: DeckCreate): Promise<Deck> {
  const { data } = await apiClient.post<Deck>('/decks/', deck);
  return data;
}

export async function updateDeck(id: string, deck: DeckUpdate): Promise<Deck> {
  const { data } = await apiClient.put<Deck>(`/decks/${id}`, deck);
  return data;
}

export async function deleteDeck(id: string): Promise<void> {
  await apiClient.delete(`/decks/${id}`);
}
