import apiClient from './client';
import type { Token, UserOut, RegisterData } from '../types';

export async function login(username: string, password: string): Promise<Token> {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const { data } = await apiClient.post<Token>('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return data;
}

export async function register(userData: RegisterData): Promise<UserOut> {
  const { data } = await apiClient.post<UserOut>('/auth/register', userData);
  return data;
}
