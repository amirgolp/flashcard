import 'json.dart';

class StorageQuota {
  const StorageQuota({
    required this.usedBytes,
    required this.maxBytes,
    required this.fileCount,
    required this.maxFiles,
    required this.subscriptionTier,
  });

  final int usedBytes;
  final int maxBytes;
  final int fileCount;
  final int maxFiles;
  final String subscriptionTier;

  factory StorageQuota.fromJson(JsonMap json) => StorageQuota(
        usedBytes: json.req<int>('used_bytes'),
        maxBytes: json.req<int>('max_bytes'),
        fileCount: json.req<int>('file_count'),
        maxFiles: json.req<int>('max_files'),
        subscriptionTier: json.req<String>('subscription_tier'),
      );
}

class StorageConfigResponse {
  const StorageConfigResponse({
    required this.isConfigured,
    required this.quota,
    this.storageType,
  });

  final String? storageType;
  final bool isConfigured;
  final StorageQuota quota;

  factory StorageConfigResponse.fromJson(JsonMap json) => StorageConfigResponse(
        storageType: json.opt<String>('storage_type'),
        isConfigured: json.req<bool>('is_configured'),
        quota: StorageQuota.fromJson(json.req<JsonMap>('quota')),
      );
}
