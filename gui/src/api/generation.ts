import apiClient from './client';
import type {
  GenerateNextBatchRequest, GenerateFromRangeRequest, GenerationResponse,
  DraftCardResponse, DraftCardUpdate, BulkApproveRequest, Card,
} from '../types';

export async function generateNextBatch(req: GenerateNextBatchRequest): Promise<GenerationResponse> {
  const { data } = await apiClient.post<GenerationResponse>('/generate/next-batch', req);
  return data;
}

export async function generateFromRange(req: GenerateFromRangeRequest): Promise<GenerationResponse> {
  const { data } = await apiClient.post<GenerationResponse>('/generate/from-range', req);
  return data;
}

export async function listDrafts(params: {
  book_id?: string; batch_id?: string; status?: string; skip?: number; limit?: number;
}): Promise<DraftCardResponse[]> {
  const { data } = await apiClient.get<DraftCardResponse[]>('/generate/drafts', { params });
  return data;
}

export async function updateDraft(id: string, draft: DraftCardUpdate): Promise<DraftCardResponse> {
  const { data } = await apiClient.put<DraftCardResponse>(`/generate/drafts/${id}`, draft);
  return data;
}

export async function approveDraft(id: string, deckId?: string): Promise<Card> {
  const { data } = await apiClient.post<Card>(`/generate/drafts/${id}/approve`, null, {
    params: deckId ? { deck_id: deckId } : {},
  });
  return data;
}

export async function bulkApproveDrafts(req: BulkApproveRequest): Promise<Card[]> {
  const { data } = await apiClient.post<Card[]>('/generate/drafts/bulk-approve', req);
  return data;
}

export async function rejectDraft(id: string): Promise<void> {
  await apiClient.post(`/generate/drafts/${id}/reject`);
}

export async function deleteRejectedDrafts(bookId?: string): Promise<{ detail: string }> {
  const { data } = await apiClient.delete<{ detail: string }>('/generate/drafts/rejected', {
    params: bookId ? { book_id: bookId } : {},
  });
  return data;
}
