import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateNextBatch, generateFromRange, listDrafts,
  updateDraft, approveDraft, bulkApproveDrafts, rejectDraft, deleteRejectedDrafts,
} from '../api/generation';
import type {
  GenerateNextBatchRequest, GenerateFromRangeRequest,
  DraftCardUpdate, BulkApproveRequest,
} from '../types';

export function useGenerateNextBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: GenerateNextBatchRequest) => generateNextBatch(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drafts'] });
      qc.invalidateQueries({ queryKey: ['bookProgress'] });
    },
  });
}

export function useGenerateFromRange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: GenerateFromRangeRequest) => generateFromRange(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drafts'] });
      qc.invalidateQueries({ queryKey: ['bookProgress'] });
    },
  });
}

export function useDrafts(params: {
  book_id?: string; batch_id?: string; status?: string; skip?: number; limit?: number;
} = {}) {
  return useQuery({
    queryKey: ['drafts', params],
    queryFn: () => listDrafts(params),
  });
}

export function useUpdateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DraftCardUpdate }) => updateDraft(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drafts'] }),
  });
}

export function useApproveDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, deckId }: { id: string; deckId?: string }) => approveDraft(id, deckId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drafts'] });
      qc.invalidateQueries({ queryKey: ['cards'] });
    },
  });
}

export function useBulkApproveDrafts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: BulkApproveRequest) => bulkApproveDrafts(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drafts'] });
      qc.invalidateQueries({ queryKey: ['cards'] });
    },
  });
}

export function useRejectDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rejectDraft(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drafts'] }),
  });
}

export function useDeleteRejectedDrafts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookId?: string) => deleteRejectedDrafts(bookId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drafts'] }),
  });
}
