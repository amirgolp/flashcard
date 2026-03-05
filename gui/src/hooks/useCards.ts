import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listCards, getCard, createCard, updateCard, deleteCard } from '../api/cards';
import type { CardCreate, CardUpdate } from '../types';

export function useCards(skip = 0, limit = 20) {
  return useQuery({
    queryKey: ['cards', skip, limit],
    queryFn: () => listCards(skip, limit),
  });
}

export function useCard(id: string) {
  return useQuery({
    queryKey: ['cards', id],
    queryFn: () => getCard(id),
    enabled: !!id,
  });
}

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CardCreate) => createCard(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards'] }),
  });
}

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CardUpdate }) => updateCard(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards'] }),
  });
}

export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCard(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards'] }),
  });
}
