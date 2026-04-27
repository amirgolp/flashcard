import 'package:dio/dio.dart';
import 'package:drift/native.dart';
import 'package:flashcard_mobile/core/api/api_client.dart';
import 'package:flashcard_mobile/core/api/decks_api.dart';
import 'package:flashcard_mobile/core/api/providers.dart';
import 'package:flashcard_mobile/core/api/token_store.dart';
import 'package:flashcard_mobile/core/auth/auth_service.dart';
import 'package:flashcard_mobile/core/db/app_database.dart';
import 'package:flashcard_mobile/core/db/card_cache_service.dart';
import 'package:flashcard_mobile/features/decks/decks_controller.dart';
import 'package:flashcard_mobile/shared/models/deck.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _Stub implements HttpClientAdapter {
  _Stub(this._respond);

  final ResponseBody Function(RequestOptions) _respond;
  final List<RequestOptions> calls = [];

  @override
  void close({bool force = false}) {}

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<List<int>>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    calls.add(options);
    return _respond(options);
  }
}

ResponseBody _json(int status, String body) => ResponseBody.fromString(
      body,
      status,
      headers: {
        'content-type': ['application/json'],
      },
    );

ProviderContainer _container(_Stub stub) {
  // Path_provider isn't wired in unit tests, so AppDatabase()'s default
  // constructor would throw; swap in an in-memory drift db.
  bool sqliteAvailable = true;
  AppDatabase? db;
  try {
    db = AppDatabase.forTesting(NativeDatabase.memory());
  } catch (_) {
    sqliteAvailable = false;
  }

  return ProviderContainer(overrides: [
    tokenStoreProvider.overrideWith((_) => InMemoryTokenStore()),
    authServiceProvider.overrideWith((ref) => const NoopAuthService()),
    apiClientProvider.overrideWith((ref) {
      final client = ApiClient(
        baseUrl: 'http://t.local',
        tokenStore: ref.watch(tokenStoreProvider),
        refresh: () async => null,
        onAuthInvalid: () {},
      );
      client.dio.httpClientAdapter = stub;
      return client;
    }),
    decksApiProvider.overrideWith((ref) => DecksApi(ref.watch(apiClientProvider))),
    if (sqliteAvailable)
      appDatabaseProvider.overrideWithValue(db!),
    cardCacheServiceProvider.overrideWith((ref) {
      // When sqlite isn't usable on this host, hand back a service that
      // points at an unopened db; the snapshot call is best-effort and
      // wrapped in try/catch by the controller anyway.
      final database = sqliteAvailable
          ? ref.watch(appDatabaseProvider)
          : AppDatabase.forTesting(NativeDatabase.memory());
      return CardCacheService(database, () => ref.read(decksApiProvider));
    }),
  ]);
}

void main() {
  test('initial build calls list and exposes the data', () async {
    final stub = _Stub((options) {
      expect(options.method, 'GET');
      expect(options.path, contains('/decks'));
      return _json(
        200,
        '[{"id":"d1","name":"Spanish","cards":[]},'
        '{"id":"d2","name":"German","cards":[]}]',
      );
    });
    final container = _container(stub);
    addTearDown(container.dispose);

    final value = await container.read(decksControllerProvider.future);
    expect(value, hasLength(2));
    expect(value.first.name, 'Spanish');
  });

  test('create appends to the cached list', () async {
    final stub = _Stub((options) {
      if (options.method == 'GET') {
        return _json(200, '[]');
      }
      return _json(201, '{"id":"d1","name":"Created","cards":[]}');
    });
    final container = _container(stub);
    addTearDown(container.dispose);

    await container.read(decksControllerProvider.future);
    final notifier = container.read(decksControllerProvider.notifier);
    await notifier.create(const DeckCreate(name: 'Created'));

    final state = container.read(decksControllerProvider).value!;
    expect(state, hasLength(1));
    expect(state.single.name, 'Created');
  });

  test('delete removes the item from the cached list', () async {
    final stub = _Stub((options) {
      if (options.method == 'GET') {
        return _json(
          200,
          '[{"id":"d1","name":"A","cards":[]},'
          '{"id":"d2","name":"B","cards":[]}]',
        );
      }
      return _json(200, '{"detail":"deleted"}');
    });
    final container = _container(stub);
    addTearDown(container.dispose);

    await container.read(decksControllerProvider.future);
    await container.read(decksControllerProvider.notifier).delete('d1');

    final state = container.read(decksControllerProvider).value!;
    expect(state, hasLength(1));
    expect(state.single.id, 'd2');
  });

  test('refresh issues another GET', () async {
    var calls = 0;
    final stub = _Stub((_) {
      calls += 1;
      return _json(200, '[]');
    });
    final container = _container(stub);
    addTearDown(container.dispose);

    await container.read(decksControllerProvider.future);
    await container.read(decksControllerProvider.notifier).refresh();
    expect(calls, 2);
  });
}
