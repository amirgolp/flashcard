import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_service.dart';
import '../auth/secure_token_store.dart';
import 'api_client.dart';
import 'auth_api.dart';
import 'books_api.dart';
import 'cards_api.dart';
import 'decks_api.dart';
import 'generation_api.dart';
import 'templates_api.dart';
import 'token_store.dart';

/// Override at app boot with whatever the build was launched against:
/// `--dart-define=API_BASE_URL=http://10.0.2.2:8000` for Android emulator
/// pointing at a host-machine FastAPI, etc.
final apiBaseUrlProvider = Provider<String>((ref) {
  const value = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8000',
  );
  return value;
});

final tokenStoreProvider = Provider<TokenStore>((ref) => SecureTokenStore());

final apiClientProvider = Provider<ApiClient>((ref) {
  final auth = ref.watch(authServiceProvider);
  return ApiClient(
    baseUrl: ref.watch(apiBaseUrlProvider),
    tokenStore: ref.watch(tokenStoreProvider),
    refresh: auth.refresh,
    onAuthInvalid: auth.onSessionInvalidated,
  );
});

final authApiProvider =
    Provider<AuthApi>((ref) => AuthApi(ref.watch(apiClientProvider)));
final decksApiProvider =
    Provider<DecksApi>((ref) => DecksApi(ref.watch(apiClientProvider)));
final cardsApiProvider =
    Provider<CardsApi>((ref) => CardsApi(ref.watch(apiClientProvider)));
final booksApiProvider =
    Provider<BooksApi>((ref) => BooksApi(ref.watch(apiClientProvider)));
final templatesApiProvider =
    Provider<TemplatesApi>((ref) => TemplatesApi(ref.watch(apiClientProvider)));
final generationApiProvider = Provider<GenerationApi>(
    (ref) => GenerationApi(ref.watch(apiClientProvider)));
