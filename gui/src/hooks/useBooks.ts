import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listBooks, getBook, uploadBook, updateBook, deleteBook,
  getBookProgress, updateBookProgress, updateBookChapters,
} from '../api/books';
import type { BookUpdate, BookProgressUpdate, Chapter } from '../types';

export function useBooks(skip = 0, limit = 20) {
  return useQuery({
    queryKey: ['books', skip, limit],
    queryFn: () => listBooks(skip, limit),
  });
}

export function useBook(id: string) {
  return useQuery({
    queryKey: ['books', id],
    queryFn: () => getBook(id),
    enabled: !!id,
  });
}

export function useUploadBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { file: File; title: string; targetLanguage?: string; nativeLanguage?: string }) =>
      uploadBook(args.file, args.title, args.targetLanguage, args.nativeLanguage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
  });
}

export function useUpdateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BookUpdate }) => updateBook(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBook(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
  });
}

export function useBookProgress(bookId: string) {
  return useQuery({
    queryKey: ['bookProgress', bookId],
    queryFn: () => getBookProgress(bookId),
    enabled: !!bookId,
  });
}

export function useUpdateBookProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookId, data }: { bookId: string; data: BookProgressUpdate }) =>
      updateBookProgress(bookId, data),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['bookProgress', vars.bookId] }),
  });
}

export function useUpdateBookChapters() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookId, chapters }: { bookId: string; chapters: Chapter[] }) =>
      updateBookChapters(bookId, chapters),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['books', vars.bookId] });
    },
  });
}
