import 'package:dio/dio.dart';
import 'package:flashcard_mobile/core/api/api_client.dart';
import 'package:flashcard_mobile/core/api/auth_api.dart';
import 'package:flashcard_mobile/core/api/providers.dart';
import 'package:flashcard_mobile/core/api/token_store.dart';
import 'package:flashcard_mobile/core/auth/auth_controller.dart';
import 'package:flashcard_mobile/core/auth/auth_service.dart';
import 'package:flashcard_mobile/core/auth/auth_state.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeAdapter implements HttpClientAdapter {
  _FakeAdapter(this._respond);

  final ResponseBody Function(RequestOptions) _respond;

  @override
  void close({bool force = false}) {}

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<List<int>>? requestStream,
    Future<void>? cancelFuture,
  ) async =>
      _respond(options);
}

ProviderContainer _container({
  required HttpClientAdapter adapter,
  required TokenStore tokenStore,
}) {
  return ProviderContainer(overrides: [
    tokenStoreProvider.overrideWithValue(tokenStore),
    authServiceProvider.overrideWith((ref) => const NoopAuthService()),
    apiClientProvider.overrideWith((ref) {
      final client = ApiClient(
        baseUrl: 'http://test.local',
        tokenStore: ref.watch(tokenStoreProvider),
        refresh: () async => null,
        onAuthInvalid: () {},
      );
      client.dio.httpClientAdapter = adapter;
      return client;
    }),
    authApiProvider.overrideWith((ref) => AuthApi(ref.watch(apiClientProvider))),
  ]);
}

ResponseBody _json(int status, String body) => ResponseBody.fromString(
      body,
      status,
      headers: {
        'content-type': ['application/json'],
      },
    );

void main() {
  test('login: success persists token and transitions to authenticated',
      () async {
    final store = InMemoryTokenStore();
    final adapter = _FakeAdapter((options) {
      expect(options.path, contains('/auth/login'));
      return _json(200, '{"access_token":"jwt","token_type":"bearer"}');
    });
    final container = _container(adapter: adapter, tokenStore: store);
    addTearDown(container.dispose);

    final controller = container.read(authControllerProvider.notifier);
    await controller.login(username: 'amir', password: 'pw1234567');

    expect(container.read(authControllerProvider).status,
        AuthStatus.authenticated);
    expect(await store.readAccessToken(), 'jwt');
  });

  test('login: 401 surfaces a readable error', () async {
    final store = InMemoryTokenStore();
    final adapter = _FakeAdapter(
      (_) => _json(401, '{"detail":"Incorrect username or password"}'),
    );
    final container = _container(adapter: adapter, tokenStore: store);
    addTearDown(container.dispose);

    final controller = container.read(authControllerProvider.notifier);
    await controller.login(username: 'amir', password: 'wrong');

    final state = container.read(authControllerProvider);
    expect(state.status, AuthStatus.unauthenticated);
    expect(state.errorMessage, contains('Incorrect username or password'));
    expect(await store.readAccessToken(), isNull);
  });

  test('restore with token → authenticated', () async {
    final store = InMemoryTokenStore();
    await store.save(accessToken: 'jwt');
    final adapter = _FakeAdapter((_) => _json(200, '{}'));
    final container = _container(adapter: adapter, tokenStore: store);
    addTearDown(container.dispose);

    await container.read(authControllerProvider.notifier).restore();
    expect(container.read(authControllerProvider).status,
        AuthStatus.authenticated);
  });

  test('restore without token → unauthenticated', () async {
    final store = InMemoryTokenStore();
    final adapter = _FakeAdapter((_) => _json(200, '{}'));
    final container = _container(adapter: adapter, tokenStore: store);
    addTearDown(container.dispose);

    await container.read(authControllerProvider.notifier).restore();
    expect(container.read(authControllerProvider).status,
        AuthStatus.unauthenticated);
  });

  test('logout clears the token', () async {
    final store = InMemoryTokenStore();
    await store.save(accessToken: 'jwt');
    final adapter = _FakeAdapter((_) => _json(200, '{}'));
    final container = _container(adapter: adapter, tokenStore: store);
    addTearDown(container.dispose);

    final controller = container.read(authControllerProvider.notifier);
    await controller.restore();
    await controller.logout();

    expect(container.read(authControllerProvider).status,
        AuthStatus.unauthenticated);
    expect(await store.readAccessToken(), isNull);
  });

  test('onSessionInvalidated kicks an authenticated session out', () async {
    final store = InMemoryTokenStore();
    await store.save(accessToken: 'jwt');
    final adapter = _FakeAdapter((_) => _json(200, '{}'));
    final container = _container(adapter: adapter, tokenStore: store);
    addTearDown(container.dispose);

    final controller = container.read(authControllerProvider.notifier);
    await controller.restore();
    controller.onSessionInvalidated();

    final state = container.read(authControllerProvider);
    expect(state.status, AuthStatus.unauthenticated);
    expect(state.errorMessage, contains('expired'));
  });
}
