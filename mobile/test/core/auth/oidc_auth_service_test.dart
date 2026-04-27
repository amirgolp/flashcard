import 'dart:convert';

import 'package:flashcard_mobile/core/auth/oidc_auth_service.dart';
import 'package:flashcard_mobile/core/auth/oidc_config.dart';
import 'package:flashcard_mobile/core/auth/secure_token_store.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_secure_storage_platform_interface/flutter_secure_storage_platform_interface.dart';
import 'package:flutter_test/flutter_test.dart';

class _InMemorySecureStorage extends FlutterSecureStoragePlatform {
  final Map<String, String> _store = {};

  @override
  Future<bool> containsKey({
    required String key,
    required Map<String, String> options,
  }) async =>
      _store.containsKey(key);

  @override
  Future<void> delete({
    required String key,
    required Map<String, String> options,
  }) async {
    _store.remove(key);
  }

  @override
  Future<void> deleteAll({required Map<String, String> options}) async {
    _store.clear();
  }

  @override
  Future<String?> read({
    required String key,
    required Map<String, String> options,
  }) async =>
      _store[key];

  @override
  Future<Map<String, String>> readAll({
    required Map<String, String> options,
  }) async =>
      Map.of(_store);

  @override
  Future<void> write({
    required String key,
    required String value,
    required Map<String, String> options,
  }) async {
    _store[key] = value;
  }
}

String _fakeJwt(Map<String, Object?> claims) {
  String b64(String s) =>
      base64Url.encode(utf8.encode(s)).replaceAll('=', '');
  final header = b64(jsonEncode({'alg': 'RS256', 'typ': 'JWT'}));
  final payload = b64(jsonEncode(claims));
  return '$header.$payload.signature';
}

void main() {
  setUp(() {
    FlutterSecureStoragePlatform.instance = _InMemorySecureStorage();
  });

  test('OidcConfig.fromEnv reports unconfigured when env vars are missing', () {
    const config = OidcConfig.fromEnv;
    expect(config.isConfigured, isFalse);
  });

  test('OidcConfig.discoveryUrl points at well-known endpoint', () {
    const config = OidcConfig(
      issuer: 'https://flashcard.zitadel.cloud',
      clientId: '12345@flashcard',
      redirectUri: 'com.flashcard.mobile:/oauthredirect',
    );
    expect(
      config.discoveryUrl,
      'https://flashcard.zitadel.cloud/.well-known/openid-configuration',
    );
  });

  test('claimsFromIdToken decodes preferred_username + email', () {
    final service = OidcAuthService(
      config: const OidcConfig(
        issuer: 'https://example',
        clientId: 'c',
        redirectUri: 'app:/cb',
      ),
      tokenStore: SecureTokenStore(storage: const FlutterSecureStorage()),
    );
    final jwt = _fakeJwt({
      'sub': 'user-123',
      'preferred_username': 'amir',
      'email': 'amir@example.com',
    });
    final claims = service.claimsFromIdToken(jwt);
    expect(claims['sub'], 'user-123');
    expect(claims['preferred_username'], 'amir');
    expect(claims['email'], 'amir@example.com');
  });

  test('claimsFromIdToken returns empty map for malformed token', () {
    final service = OidcAuthService(
      config: const OidcConfig(
        issuer: 'https://example',
        clientId: 'c',
        redirectUri: 'app:/cb',
      ),
      tokenStore: SecureTokenStore(storage: const FlutterSecureStorage()),
    );
    expect(service.claimsFromIdToken('not.a.jwt.at.all'), isEmpty);
    expect(service.claimsFromIdToken(''), isEmpty);
  });

  test('login throws OidcConfigurationException when not configured',
      () async {
    final service = OidcAuthService(
      config: const OidcConfig(issuer: '', clientId: '', redirectUri: ''),
      tokenStore: SecureTokenStore(storage: const FlutterSecureStorage()),
    );
    await expectLater(
      service.login(),
      throwsA(isA<OidcConfigurationException>()),
    );
  });

  test('SecureTokenStore round-trips OIDC fields', () async {
    final store = SecureTokenStore(storage: const FlutterSecureStorage());
    final expiry = DateTime.utc(2026, 5, 1);
    await store.saveOidc(
      accessToken: 'at',
      refreshToken: 'rt',
      idToken: 'idt',
      accessExpiresAt: expiry,
    );
    expect(await store.readAccessToken(), 'at');
    expect(await store.readRefreshToken(), 'rt');
    expect(await store.readIdToken(), 'idt');
    expect(await store.readAccessExpiry(), expiry);

    await store.clear();
    expect(await store.readAccessToken(), isNull);
    expect(await store.readRefreshToken(), isNull);
  });
}
