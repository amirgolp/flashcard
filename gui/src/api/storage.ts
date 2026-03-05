import apiClient from './client';
import type { StorageConfig, StorageQuota, TelegramStorageConfig, GoogleDriveAuthResponse } from '../types';

export async function getStorageConfig(): Promise<StorageConfig> {
  const { data } = await apiClient.get<StorageConfig>('/storage/config');
  return data;
}

export async function getStorageQuota(): Promise<StorageQuota> {
  const { data } = await apiClient.get<StorageQuota>('/storage/quota');
  return data;
}

export async function configureTelegram(config: TelegramStorageConfig): Promise<{ message: string }> {
  const { data } = await apiClient.post('/storage/configure/telegram', config);
  return data;
}

export async function initiateGoogleDriveAuth(): Promise<GoogleDriveAuthResponse> {
  const { data } = await apiClient.get<GoogleDriveAuthResponse>('/storage/configure/google-drive/auth');
  return data;
}

export async function disconnectStorage(): Promise<{ message: string }> {
  const { data } = await apiClient.post('/storage/disconnect');
  return data;
}
