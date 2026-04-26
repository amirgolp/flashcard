// Zitadel OIDC auth via flutter_appauth.
// TODO: implement login/logout/refresh against Zitadel using values from .env.

abstract class AuthService {
  Future<String?> currentAccessToken();
  Future<void> login();
  Future<void> logout();
  Future<String?> refresh();
}
