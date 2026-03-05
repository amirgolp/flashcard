import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStorageConfig, getStorageQuota, configureTelegram, initiateGoogleDriveAuth, disconnectStorage,
} from '../api/storage';
import type { TelegramStorageConfig } from '../types';

export function useStorageConfig() {
  return useQuery({
    queryKey: ['storage', 'config'],
    queryFn: getStorageConfig,
  });
}

export function useStorageQuota() {
  return useQuery({
    queryKey: ['storage', 'quota'],
    queryFn: getStorageQuota,
  });
}

export function useConfigureTelegram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: TelegramStorageConfig) => configureTelegram(config),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['storage'] }),
  });
}

export function useInitiateGoogleDriveAuth() {
  return useMutation({
    mutationFn: initiateGoogleDriveAuth,
    onSuccess: (data) => {
      window.location.href = data.authorization_url;
    },
  });
}

export function useDisconnectStorage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: disconnectStorage,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['storage'] }),
  });
}
