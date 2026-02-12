import apiClient from './client';
import type { BookResponse, BookUpdate, BookProgressResponse, BookProgressUpdate, Chapter } from '../types';

export async function listBooks(skip = 0, limit = 20): Promise<BookResponse[]> {
  const { data } = await apiClient.get<BookResponse[]>('/books/', { params: { skip, limit } });
  return data;
}

export async function getBook(id: string): Promise<BookResponse> {
  const { data } = await apiClient.get<BookResponse>(`/books/${id}`);
  return data;
}

export async function uploadBook(
  file: File, title: string, targetLanguage?: string, nativeLanguage?: string
): Promise<BookResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  if (targetLanguage) formData.append('target_language', targetLanguage);
  if (nativeLanguage) formData.append('native_language', nativeLanguage);

  const { data } = await apiClient.post<BookResponse>('/books/', formData);
  return data;
}

export async function updateBook(id: string, book: BookUpdate): Promise<BookResponse> {
  const { data } = await apiClient.put<BookResponse>(`/books/${id}`, book);
  return data;
}

export async function deleteBook(id: string): Promise<void> {
  await apiClient.delete(`/books/${id}`);
}

export async function getBookProgress(bookId: string): Promise<BookProgressResponse> {
  const { data } = await apiClient.get<BookProgressResponse>(`/books/${bookId}/progress`);
  return data;
}

export async function updateBookProgress(bookId: string, progress: BookProgressUpdate): Promise<BookProgressResponse> {
  const { data } = await apiClient.put<BookProgressResponse>(`/books/${bookId}/progress`, progress);
  return data;
}

export async function updateBookChapters(bookId: string, chapters: Chapter[]): Promise<BookResponse> {
  const { data } = await apiClient.put<BookResponse>(`/books/${bookId}/chapters`, chapters);
  return data;
}
