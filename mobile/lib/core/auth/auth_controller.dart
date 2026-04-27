import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/models/user.dart';
import '../api/api_exception.dart';
import '../api/auth_api.dart';
import '../api/providers.dart';
import '../api/token_store.dart';
import 'auth_service.dart';
import 'auth_state.dart';

/// Holds the [AuthState] for the running app and exposes the actions a
/// UI page might invoke (login, register, logout, restore-on-boot).
///
/// Username/password flow against the FastAPI backend. Slice 3 swaps in
/// a Zitadel OIDC implementation by replacing the [AuthApi] dependency
/// and the inner refresh logic — the public surface stays the same.
class AuthController extends Notifier<AuthState> {
  late AuthApi _authApi;
  late TokenStore _tokenStore;

  @override
  AuthState build() {
    _authApi = ref.read(authApiProvider);
    _tokenStore = ref.read(tokenStoreProvider);
    return const AuthState.unknown();
  }

  /// Called once at app start. Looks for a persisted access token; if
  /// present, marks the session as authenticated. The current backend
  /// has no /auth/me, so we don't load a fresh user object — slice 3
  /// will swap in OIDC user info.
  Future<void> restore() async {
    final token = await _tokenStore.readAccessToken();
    if (token == null || token.isEmpty) {
      state = const AuthState.unauthenticated();
      return;
    }
    state = AuthState.authenticated(_placeholderUser('restored'));
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
    await _tokenStore.clear();
    state = const AuthState.unauthenticated();
  }

  void onSessionInvalidated() {
    if (state.isAuthenticated) {
      state = const AuthState.unauthenticated(error: 'Your session expired.');
      _tokenStore.clear();
    }
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

class _ControllerBackedAuthService implements AuthService {
  _ControllerBackedAuthService(this._tokenStore, this._onInvalid);

  final TokenStore _tokenStore;
  final void Function() _onInvalid;

  @override
  Future<String?> currentAccessToken() => _tokenStore.readAccessToken();

  @override
  Future<String?> refresh() async => null;

  @override
  void onSessionInvalidated() => _onInvalid();

  @override
  Future<void> logout() => _tokenStore.clear();
}

/// Override of the placeholder [authServiceProvider] from
/// `lib/core/auth/auth_service.dart`. Wires [AuthController] into the
/// API layer's interceptor without creating a circular dependency.
final liveAuthServiceProvider = Provider<AuthService>((ref) {
  return _ControllerBackedAuthService(
    ref.watch(tokenStoreProvider),
    () => ref.read(authControllerProvider.notifier).onSessionInvalidated(),
  );
});
