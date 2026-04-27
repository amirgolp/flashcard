import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../api/token_store.dart';

/// Backed by Keychain (iOS) / Keystore (Android). Stores the access
/// token alongside the OIDC refresh token and id token so the auth
/// controller can rehydrate a session on launch and request fresh
/// tokens silently.
class SecureTokenStore implements TokenStore {
  SecureTokenStore({FlutterSecureStorage? storage})
      : _storage = storage ?? _defaultStorage();

  static const _accessKey = 'flashcard.auth.access_token';
  static const _refreshKey = 'flashcard.auth.refresh_token';
  static const _idTokenKey = 'flashcard.auth.id_token';
  static const _expiryKey = 'flashcard.auth.access_expires_at';

  final FlutterSecureStorage _storage;

  static FlutterSecureStorage _defaultStorage() => const FlutterSecureStorage(
        iOptions: IOSOptions(
          accessibility: KeychainAccessibility.first_unlock,
        ),
      );

  @override
  Future<String?> readAccessToken() => _storage.read(key: _accessKey);

  @override
  Future<String?> readRefreshToken() => _storage.read(key: _refreshKey);

  Future<String?> readIdToken() => _storage.read(key: _idTokenKey);

  Future<DateTime?> readAccessExpiry() async {
    final raw = await _storage.read(key: _expiryKey);
    if (raw == null) return null;
    return DateTime.tryParse(raw);
  }

  @override
  Future<void> save({
    required String accessToken,
    String? refreshToken,
  }) async {
    await _storage.write(key: _accessKey, value: accessToken);
    if (refreshToken != null) {
      await _storage.write(key: _refreshKey, value: refreshToken);
    }
  }

  Future<void> saveOidc({
    required String accessToken,
    String? refreshToken,
    String? idToken,
    DateTime? accessExpiresAt,
  }) async {
    await _storage.write(key: _accessKey, value: accessToken);
    if (refreshToken != null) {
      await _storage.write(key: _refreshKey, value: refreshToken);
    }
    if (idToken != null) {
      await _storage.write(key: _idTokenKey, value: idToken);
    }
    if (accessExpiresAt != null) {
      await _storage.write(
        key: _expiryKey,
        value: accessExpiresAt.toIso8601String(),
      );
    }
  }

  @override
  Future<void> clear() async {
    await Future.wait([
      _storage.delete(key: _accessKey),
      _storage.delete(key: _refreshKey),
      _storage.delete(key: _idTokenKey),
      _storage.delete(key: _expiryKey),
    ]);
  }
}
