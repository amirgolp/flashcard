import 'package:dio/dio.dart';
import 'package:drift/native.dart';
import 'package:flashcard_mobile/core/api/api_client.dart';
import 'package:flashcard_mobile/core/api/books_api.dart';
import 'package:flashcard_mobile/core/api/providers.dart';
import 'package:flashcard_mobile/core/api/token_store.dart';
import 'package:flashcard_mobile/core/auth/auth_service.dart';
import 'package:flashcard_mobile/core/db/app_database.dart';
import 'package:flashcard_mobile/core/db/card_cache_service.dart';
import 'package:flashcard_mobile/features/books/books_controller.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _Stub implements HttpClientAdapter {
  _Stub(this._respond);

  final ResponseBody Function(RequestOptions) _respond;
  int calls = 0;

  @override
  void close({bool force = false}) {}

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<List<int>>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    calls += 1;
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

ProviderContainer _container(_Stub stub, {AppDatabase? db}) =>
    ProviderContainer(overrides: [
      tokenStoreProvider.overrideWith((_) => InMemoryTokenStore()),
      authServiceProvider.overrideWith((ref) => const NoopAuthService()),
      apiClientProvider.overrideWith((ref) {
        final c = ApiClient(
          baseUrl: 'http://t.local',
          tokenStore: ref.watch(tokenStoreProvider),
          refresh: () async => null,
          onAuthInvalid: () {},
        );
        c.dio.httpClientAdapter = stub;
        return c;
      }),
      booksApiProvider.overrideWith((ref) => BooksApi(ref.watch(apiClientProvider))),
      if (db != null) appDatabaseProvider.overrideWithValue(db),
    ]);

void main() {
  test('build calls /books/ and parses the list', () async {
    final stub = _Stub((_) => _json(
          200,
          '[{"id":"b1","title":"Book","filename":"b.pdf","total_pages":42,'
          '"date_created":"2026-04-01T00:00:00Z",'
          '"last_edited":"2026-04-01T00:00:00Z"}]',
        ));
    final container = _container(stub);
    addTearDown(container.dispose);

    final value = await container.read(booksControllerProvider.future);
    expect(value, hasLength(1));
    expect(value.single.id, 'b1');
    expect(value.single.totalPages, 42);
  });

  test('delete removes the book from the cached list', () async {
    final db = AppDatabase.forTesting(NativeDatabase.memory());
    addTearDown(db.close);
    try {
      await db.customSelect('SELECT 1').get();
    } catch (e) {
      markTestSkipped('native sqlite unavailable: $e');
      return;
    }

    final stub = _Stub((options) {
      if (options.method == 'GET') {
        return _json(
          200,
          '[{"id":"b1","title":"a","filename":"a.pdf","total_pages":1,'
          '"date_created":"2026-04-01T00:00:00Z",'
          '"last_edited":"2026-04-01T00:00:00Z"},'
          '{"id":"b2","title":"b","filename":"b.pdf","total_pages":2,'
          '"date_created":"2026-04-01T00:00:00Z",'
          '"last_edited":"2026-04-01T00:00:00Z"}]',
        );
      }
      return _json(200, '{"detail":"deleted"}');
    });
    final container = _container(stub, db: db);
    addTearDown(container.dispose);

    await container.read(booksControllerProvider.future);
    await container.read(booksControllerProvider.notifier).delete('b1');
    final state = container.read(booksControllerProvider).value!;
    expect(state, hasLength(1));
    expect(state.single.id, 'b2');
  });
}
