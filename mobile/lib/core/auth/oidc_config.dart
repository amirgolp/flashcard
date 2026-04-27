/// OIDC configuration sourced from `--dart-define` flags at build time.
///
/// Example:
///   flutter run \
///     --dart-define=ZITADEL_ISSUER=https://flashcard.zitadel.cloud \
///     --dart-define=ZITADEL_CLIENT_ID=12345@flashcard \
///     --dart-define=ZITADEL_REDIRECT_URI=com.flashcard.mobile:/oauthredirect
class OidcConfig {
  const OidcConfig({
    required this.issuer,
    required this.clientId,
    required this.redirectUri,
    this.scopes = const [
      'openid',
      'profile',
      'email',
      'offline_access',
    ],
    this.audiences = const [],
  });

  final String issuer;
  final String clientId;
  final String redirectUri;
  final List<String> scopes;

  /// Optional `urn:zitadel:iam:org:project:id:<id>:aud` audiences.
  final List<String> audiences;

  bool get isConfigured =>
      issuer.isNotEmpty && clientId.isNotEmpty && redirectUri.isNotEmpty;

  static const fromEnv = OidcConfig(
    issuer: String.fromEnvironment('ZITADEL_ISSUER'),
    clientId: String.fromEnvironment('ZITADEL_CLIENT_ID'),
    redirectUri: String.fromEnvironment('ZITADEL_REDIRECT_URI'),
  );

  /// Discovery URL used by [FlutterAppAuth].
  String get discoveryUrl =>
      '$issuer/.well-known/openid-configuration';
}
