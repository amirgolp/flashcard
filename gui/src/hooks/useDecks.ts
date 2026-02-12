import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listDecks, getDeck, createDeck, updateDeck, deleteDeck } from '../api/decks';
import type { DeckCreate, DeckUpdate } from '../types';

export function useDecks(skip = 0, limit = 20) {
  return useQuery({
    queryKey: ['decks', skip, limit],
    queryFn: () => listDecks(skip, limit),
  });
}

export function useDeck(id: string) {
  return useQuery({
    queryKey: ['decks', id],
    queryFn: () => getDeck(id),
    enabled: !!id,
  });
}

export function useCreateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DeckCreate) => createDeck(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['decks'] }),
  });
}

export function useUpdateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeckUpdate }) => updateDeck(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['decks'] }),
  });
}

export function useDeleteDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDeck(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['decks'] }),
  });
}
