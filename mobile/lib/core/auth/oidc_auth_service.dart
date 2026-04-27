import 'dart:convert';

import 'package:flutter_appauth/flutter_appauth.dart';

import 'oidc_config.dart';
import 'oidc_session.dart';
import 'secure_token_store.dart';

/// Wraps `flutter_appauth` for the Zitadel flow:
/// authorization code with PKCE, refresh-token storage in
/// [SecureTokenStore], silent refresh on 401.
///
/// All code paths are pure-async and exception-typed so the auth
/// controller can map them cleanly to [AuthState].
class OidcAuthService {
  OidcAuthService({
    required this.config,
    required this.tokenStore,
    FlutterAppAuth? appAuth,
  }) : _appAuth = appAuth ?? const FlutterAppAuth();

  final OidcConfig config;
  final SecureTokenStore tokenStore;
  final FlutterAppAuth _appAuth;

  Future<OidcSession> login() async {
    if (!config.isConfigured) {
      throw const OidcConfigurationException();
    }
    final response = await _appAuth.authorizeAndExchangeCode(
      AuthorizationTokenRequest(
        config.clientId,
        config.redirectUri,
        discoveryUrl: config.discoveryUrl,
        scopes: config.scopes,
        promptValues: const ['login'],
        additionalParameters:
            config.audiences.isEmpty ? null : {'audience': config.audiences.join(' ')},
      ),
    );

    return _toSession(response);
  }

  Future<OidcSession?> silentRefresh() async {
    final refresh = await tokenStore.readRefreshToken();
    if (refresh == null || refresh.isEmpty) return null;
    if (!config.isConfigured) return null;

    try {
      final response = await _appAuth.token(
        TokenRequest(
          config.clientId,
          config.redirectUri,
          discoveryUrl: config.discoveryUrl,
          refreshToken: refresh,
          scopes: config.scopes,
          grantType: 'refresh_token',
        ),
      );
      return _toSession(response);
    } on FlutterAppAuthUserCancelledException {
      return null;
    } on Exception {
      return null;
    }
  }

  /// Decodes the JWT payload to extract claims like `sub`, `email`, and
  /// `preferred_username`. Returns an empty map if the id token isn't
  /// a parseable JWT — this is a best-effort surfacing of profile info,
  /// not a security check.
  Map<String, Object?> claimsFromIdToken(String idToken) {
    final parts = idToken.split('.');
    if (parts.length != 3) return const {};
    try {
      final payload = utf8.decode(
        base64Url.decode(base64Url.normalize(parts[1])),
      );
      final decoded = jsonDecode(payload);
      if (decoded is Map<String, Object?>) return decoded;
      return const {};
    } on Exception {
      return const {};
    }
  }

  Future<void> endSession() async {
    final idToken = await tokenStore.readIdToken();
    if (idToken == null || !config.isConfigured) {
      await tokenStore.clear();
      return;
    }
    try {
      await _appAuth.endSession(EndSessionRequest(
        idTokenHint: idToken,
        postLogoutRedirectUrl: config.redirectUri,
        discoveryUrl: config.discoveryUrl,
      ));
    } on Exception {
      // The browser-side end-session may fail (no network, user closed
      // tab) — we still want to drop local credentials.
    }
    await tokenStore.clear();
  }

  OidcSession _toSession(TokenResponse response) {
    final access = response.accessToken;
    final id = response.idToken;
    final expiry = response.accessTokenExpirationDateTime;
    if (access == null || id == null || expiry == null) {
      throw const OidcMissingTokenException();
    }
    return OidcSession(
      accessToken: access,
      idToken: id,
      refreshToken: response.refreshToken,
      accessExpiresAt: expiry,
    );
  }
}

class OidcConfigurationException implements Exception {
  const OidcConfigurationException();

  @override
  String toString() =>
      'Zitadel OIDC is not configured — set ZITADEL_ISSUER/_CLIENT_ID/'
      '_REDIRECT_URI via --dart-define at build time.';
}

class OidcMissingTokenException implements Exception {
  const OidcMissingTokenException();

  @override
  String toString() =>
      'OIDC server did not return access_token/id_token/expiry — '
      'check the configured scopes (openid + offline_access required).';
}
