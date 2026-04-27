import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/models/user.dart';
import '../api/api_exception.dart';
import '../api/auth_api.dart';
import '../api/providers.dart';
import '../api/token_store.dart';
import 'auth_service.dart';
import 'auth_state.dart';
import 'oidc_auth_service.dart';
import 'oidc_config.dart';
import 'oidc_session.dart';
import 'secure_token_store.dart';

/// Holds the [AuthState] for the running app and exposes the actions a
/// UI page might invoke. Two paths share the same state machine:
///
/// 1. **Zitadel OIDC** — preferred; when [OidcConfig.isConfigured] the
///    controller routes login/logout/refresh through [OidcAuthService].
/// 2. **Username/password JWT** — fallback used when OIDC isn't
///    configured (e.g. local dev against the FastAPI backend) and
///    exercised by tests.
class AuthController extends Notifier<AuthState> {
  late AuthApi _authApi;
  late TokenStore _tokenStore;
  OidcAuthService? _oidc;

  @override
  AuthState build() {
    _authApi = ref.read(authApiProvider);
    _tokenStore = ref.read(tokenStoreProvider);
    _oidc = ref.read(oidcAuthServiceProvider);
    return const AuthState.unknown();
  }

  bool get usesOidc => _oidc != null;

  Future<void> restore() async {
    final secure = _secureStore;
    if (secure != null) {
      final access = await secure.readAccessToken();
      final expiresAt = await secure.readAccessExpiry();
      if (access != null && access.isNotEmpty) {
        if (expiresAt != null && DateTime.now().isAfter(expiresAt)) {
          final session = await _oidc?.silentRefresh();
          if (session != null) {
            await _persistOidc(session);
            state = AuthState.authenticated(_userFromOidc(session));
            return;
          }
          await secure.clear();
          state = const AuthState.unauthenticated();
          return;
        }
        final id = await secure.readIdToken();
        state = AuthState.authenticated(_userFromIdToken(id));
        return;
      }
    } else {
      final token = await _tokenStore.readAccessToken();
      if (token != null && token.isNotEmpty) {
        state = AuthState.authenticated(_placeholderUser('restored'));
        return;
      }
    }
    state = const AuthState.unauthenticated();
  }

  Future<void> loginWithOidc() async {
    final oidc = _oidc;
    if (oidc == null) {
      state = const AuthState.unauthenticated(
        error: 'OIDC not configured for this build.',
      );
      return;
    }
    state = const AuthState.authenticating();
    try {
      final session = await oidc.login();
      await _persistOidc(session);
      state = AuthState.authenticated(_userFromOidc(session));
    } on Exception catch (e) {
      state = AuthState.unauthenticated(error: e.toString());
    }
  }

  Future<void> login({
    required String username,
    required String password,
  }) async {
    state = const AuthState.authenticating();
    try {
      final token =
          await _authApi.login(username: username, password: password);
      await _tokenStore.save(accessToken: token.accessToken);
      state = AuthState.authenticated(_placeholderUser(username));
    } on ApiException catch (e) {
      state = AuthState.unauthenticated(error: e.message);
    }
  }

  Future<void> register({
    required String username,
    required String email,
    required String password,
  }) async {
    state = const AuthState.authenticating();
    try {
      final user = await _authApi.register(
        RegisterRequest(username: username, email: email, password: password),
      );
      final token =
          await _authApi.login(username: username, password: password);
      await _tokenStore.save(accessToken: token.accessToken);
      state = AuthState.authenticated(user);
    } on ApiException catch (e) {
      state = AuthState.unauthenticated(error: e.message);
    }
  }

  Future<void> logout() async {
    final oidc = _oidc;
    if (oidc != null) {
      await oidc.endSession();
    } else {
      await _tokenStore.clear();
    }
    state = const AuthState.unauthenticated();
  }

  void onSessionInvalidated() {
    if (state.isAuthenticated) {
      state = const AuthState.unauthenticated(error: 'Your session expired.');
      _tokenStore.clear();
    }
  }

  /// Called by [_ControllerBackedAuthService.refresh] when the API
  /// interceptor sees a 401. Returns the new access token, or null when
  /// refresh isn't possible (no refresh token, server rejected).
  Future<String?> refreshAccessToken() async {
    final oidc = _oidc;
    if (oidc == null) return null;
    state = state.copyWith(status: AuthStatus.refreshing);
    final session = await oidc.silentRefresh();
    if (session == null) {
      onSessionInvalidated();
      return null;
    }
    await _persistOidc(session);
    state = AuthState.authenticated(
      state.user ?? _userFromOidc(session),
    );
    return session.accessToken;
  }

  SecureTokenStore? get _secureStore =>
      _tokenStore is SecureTokenStore ? _tokenStore as SecureTokenStore : null;

  Future<void> _persistOidc(OidcSession session) async {
    final secure = _secureStore;
    if (secure != null) {
      await secure.saveOidc(
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        idToken: session.idToken,
        accessExpiresAt: session.accessExpiresAt,
      );
    } else {
      await _tokenStore.save(
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      );
    }
  }

  User _userFromOidc(OidcSession session) {
    final claims = _oidc?.claimsFromIdToken(session.idToken) ?? const {};
    return User(
      id: (claims['sub'] as String?) ?? 'unknown',
      username: (claims['preferred_username'] as String?) ??
          (claims['name'] as String?) ??
          'user',
      email: (claims['email'] as String?) ?? '',
      dateCreated: DateTime.now(),
    );
  }

  User _userFromIdToken(String? idToken) {
    if (idToken == null) return _placeholderUser('restored');
    final claims = _oidc?.claimsFromIdToken(idToken) ?? const {};
    return User(
      id: (claims['sub'] as String?) ?? 'unknown',
      username: (claims['preferred_username'] as String?) ??
          (claims['name'] as String?) ??
          'restored',
      email: (claims['email'] as String?) ?? '',
      dateCreated: DateTime.now(),
    );
  }

  static User _placeholderUser(String username) => User(
        id: 'unknown',
        username: username,
        email: '$username@local',
        dateCreated: DateTime.now(),
      );
}

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);

/// Returns the OIDC service when ZITADEL_* env values are present; null
/// otherwise (so the username/password fallback runs unchanged).
final oidcAuthServiceProvider = Provider<OidcAuthService?>((ref) {
  const config = OidcConfig.fromEnv;
  if (!config.isConfigured) return null;
  final store = ref.watch(tokenStoreProvider);
  if (store is! SecureTokenStore) return null;
  return OidcAuthService(config: config, tokenStore: store);
});

class _ControllerBackedAuthService implements AuthService {
  _ControllerBackedAuthService(this._tokenStore, this._refresh, this._onInvalid);

  final TokenStore _tokenStore;
  final Future<String?> Function() _refresh;
  final void Function() _onInvalid;

  @override
  Future<String?> currentAccessToken() => _tokenStore.readAccessToken();

  @override
  Future<String?> refresh() => _refresh();

  @override
  void onSessionInvalidated() => _onInvalid();

  @override
  Future<void> logout() => _tokenStore.clear();
}

/// Wires [AuthController] into the API layer's interceptor.
final liveAuthServiceProvider = Provider<AuthService>((ref) {
  return _ControllerBackedAuthService(
    ref.watch(tokenStoreProvider),
    () => ref.read(authControllerProvider.notifier).refreshAccessToken(),
    () => ref.read(authControllerProvider.notifier).onSessionInvalidated(),
  );
});
