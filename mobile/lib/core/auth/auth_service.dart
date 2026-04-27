import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Common contract that the API layer talks to. The concrete impl
/// (Zitadel OIDC, password JWT, fake) is wired up in `auth_state.dart`
/// once the app shell is in place — for now [NoopAuthService] keeps the
/// interceptor wiring runnable without a session.
abstract class AuthService {
  Future<String?> currentAccessToken();

  /// Refresh the access token if possible. Returns the new access token,
  /// or `null` if the session can't be refreshed (no refresh token, or
  /// the refresh endpoint rejected us).
  Future<String?> refresh();

  /// Invoked by the auth interceptor when refresh fails — the auth state
  /// machine should transition the app to the unauthenticated state and
  /// clear any cached session data.
  void onSessionInvalidated();

  Future<void> logout();
}

/// Returns no token, can't refresh, swallows invalidation. Slice 2 swaps
/// this out for the real state machine.
class NoopAuthService implements AuthService {
  const NoopAuthService();

  @override
  Future<String?> currentAccessToken() async => null;

  @override
  Future<String?> refresh() async => null;

  @override
  void onSessionInvalidated() {}

  @override
  Future<void> logout() async {}
}

final authServiceProvider =
    Provider<AuthService>((ref) => const NoopAuthService());
