/// Thin abstraction over wherever auth tokens live. The Dio interceptor
/// reads/writes through this so it doesn't care whether the backing store
/// is a username/password JWT or an OIDC session in flutter_secure_storage.
abstract class TokenStore {
  Future<String?> readAccessToken();
  Future<String?> readRefreshToken();
  Future<void> save({required String accessToken, String? refreshToken});
  Future<void> clear();
}

/// In-memory store. Used by tests and the [FakeAuthService] until the
/// secure-storage-backed implementation lands in slice 3.
class InMemoryTokenStore implements TokenStore {
  String? _access;
  String? _refresh;

  @override
  Future<String?> readAccessToken() async => _access;

  @override
  Future<String?> readRefreshToken() async => _refresh;

  @override
  Future<void> save({required String accessToken, String? refreshToken}) async {
    _access = accessToken;
    if (refreshToken != null) _refresh = refreshToken;
  }

  @override
  Future<void> clear() async {
    _access = null;
    _refresh = null;
  }
}
