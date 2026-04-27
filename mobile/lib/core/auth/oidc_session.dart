/// Decoded OIDC tokens, surfaced together so the controller can persist
/// them and probe expiry. Wraps the bits we actually use from
/// `flutter_appauth`'s response.
class OidcSession {
  const OidcSession({
    required this.accessToken,
    required this.idToken,
    required this.accessExpiresAt,
    this.refreshToken,
  });

  final String accessToken;
  final String idToken;
  final String? refreshToken;
  final DateTime accessExpiresAt;

  bool get isExpired =>
      DateTime.now().isAfter(accessExpiresAt.subtract(const Duration(seconds: 30)));
}
