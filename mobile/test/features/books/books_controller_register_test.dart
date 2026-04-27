import 'dart:io';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:drift/drift.dart' show OrderingTerm;
import 'package:drift/native.dart';
import 'package:flashcard_mobile/core/api/api_client.dart';
import 'package:flashcard_mobile/core/api/books_api.dart';
import 'package:flashcard_mobile/core/api/providers.dart';
import 'package:flashcard_mobile/core/api/token_store.dart';
import 'package:flashcard_mobile/core/auth/auth_service.dart';
import 'package:flashcard_mobile/core/db/app_database.dart';
import 'package:flashcard_mobile/core/db/card_cache_service.dart';
import 'package:flashcard_mobile/core/pdf/pdf_metadata.dart';
import 'package:flashcard_mobile/features/books/books_controller.dart';
import 'package:flashcard_mobile/features/books/local_book_store.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

/// Coverage for the device-only book ingest flow:
/// the page-counter is invoked, the API receives a metadata-only
/// POST, the bytes get written under the docs dir, drift indexes the
/// new book, and the controller state surfaces it.
///
/// pdfrx itself isn't exercised here — pdfium uses FFI + background
/// isolates that don't initialize in `flutter test`. The counter is
/// overridden via [pdfPageCounterProvider]; the real renderer runs
/// at app boot via [main.dart] and on real devices.
class _Stub implements HttpClientAdapter {
  _Stub(this._respond);

  final ResponseBody Function(RequestOptions) _respond;
  final List<RequestOptions> requests = [];

  @override
  void close({bool force = false}) {}

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<List<int>>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
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

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'register counts pages, posts metadata, writes the PDF locally, '
    'and indexes it in drift',
    () async {
      final db = AppDatabase.forTesting(NativeDatabase.memory());
      addTearDown(db.close);
      try {
        await db.customSelect('SELECT 1').get();
      } catch (e) {
        markTestSkipped('native sqlite unavailable: $e');
        return;
      }

      final tempDir = await Directory.systemTemp.createTemp('flash_test_');
      addTearDown(() async {
        if (await tempDir.exists()) {
          await tempDir.delete(recursive: true);
        }
      });

      final pdfBytes =
          await File('test/fixtures/sample.pdf').readAsBytes();

      final stub = _Stub((options) {
        if (options.method == 'POST' &&
            options.path.endsWith('/books/')) {
          final data = options.data as Map<String, Object?>;
          return _json(
            200,
            '{"id":"server-id-42","title":"${data['title']}",'
            '"filename":"${data['filename']}",'
            '"total_pages":${data['total_pages']},'
            '"target_language":${_jsonOpt(data['target_language'])},'
            '"native_language":${_jsonOpt(data['native_language'])},'
            '"date_created":"2026-04-27T00:00:00Z",'
            '"last_edited":"2026-04-27T00:00:00Z"}',
          );
        }
        if (options.method == 'GET' && options.path.endsWith('/books/')) {
          return _json(200, '[]');
        }
        return _json(500, '{"detail":"unexpected request"}');
      });

      var counterCalls = 0;
      Future<int> stubCounter(Uint8List bytes) async {
        counterCalls += 1;
        // Confirm the controller forwards the actual file bytes,
        // not a slice or stand-in.
        expect(bytes.length, pdfBytes.length);
        return 3;
      }

      final container = ProviderContainer(overrides: [
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
        booksApiProvider
            .overrideWith((ref) => BooksApi(ref.watch(apiClientProvider))),
        appDatabaseProvider.overrideWithValue(db),
        localBookDocsRootProvider.overrideWithValue(tempDir),
        pdfPageCounterProvider.overrideWithValue(stubCounter),
      ]);
      addTearDown(container.dispose);

      // Prime the controller (loads the empty list).
      await container.read(booksControllerProvider.future);

      final book = await container
          .read(booksControllerProvider.notifier)
          .register(
            bytes: Uint8List.fromList(pdfBytes),
            filename: 'sample.pdf',
            title: 'A Sample Book',
            targetLanguage: 'de',
            nativeLanguage: 'en',
          );

      expect(counterCalls, 1, reason: 'counter should be invoked once');
      expect(book.totalPages, 3);
      expect(book.id, 'server-id-42');

      // POST body is metadata-only — no multipart, no bytes.
      final create = stub.requests
          .firstWhere((r) => r.method == 'POST' && r.path.endsWith('/books/'));
      final body = create.data as Map<String, Object?>;
      expect(body['title'], 'A Sample Book');
      expect(body['total_pages'], 3);
      expect(body['filename'], 'sample.pdf');
      expect(body['target_language'], 'de');
      expect(body['native_language'], 'en');
      expect(body.containsKey('file'), isFalse);
      expect(body.containsKey('bytes'), isFalse);

      // The PDF landed under the injected docs dir, intact.
      final stored = File('${tempDir.path}/books/server-id-42.pdf');
      expect(await stored.exists(), isTrue);
      expect(await stored.length(), pdfBytes.length);

      // Drift indexed the row with the local path.
      final rows = await (db.select(db.books)
            ..orderBy([(b) => OrderingTerm(expression: b.title)]))
          .get();
      expect(rows, hasLength(1));
      expect(rows.single.id, 'server-id-42');
      expect(rows.single.totalPages, 3);
      expect(rows.single.filePath, stored.path);

      // Controller state surfaces the new book at the head.
      final state = container.read(booksControllerProvider).value!;
      expect(state.first.id, 'server-id-42');
    },
  );

  test(
    'register rolls back the server record when the local write fails',
    () async {
      final db = AppDatabase.forTesting(NativeDatabase.memory());
      addTearDown(db.close);
      try {
        await db.customSelect('SELECT 1').get();
      } catch (e) {
        markTestSkipped('native sqlite unavailable: $e');
        return;
      }

      // Point the docs root at a *file* (not a directory) so writing
      // the PDF underneath it fails. Mirrors disk-full / permission
      // failures the rollback path was written for.
      final tempFile = await File(
        '${Directory.systemTemp.path}/flash_test_blocker_${DateTime.now().microsecondsSinceEpoch}',
      ).create();
      addTearDown(() async {
        if (await tempFile.exists()) await tempFile.delete();
      });
      // ignore: avoid_dynamic_calls
      final blockingDir = Directory(tempFile.path);

      final pdfBytes =
          await File('test/fixtures/sample.pdf').readAsBytes();

      var deleteCalled = false;
      final stub = _Stub((options) {
        if (options.method == 'POST' &&
            options.path.endsWith('/books/')) {
          return _json(
            200,
            '{"id":"to-rollback","title":"X","filename":"x.pdf",'
            '"total_pages":3,'
            '"date_created":"2026-04-27T00:00:00Z",'
            '"last_edited":"2026-04-27T00:00:00Z"}',
          );
        }
        if (options.method == 'DELETE' &&
            options.path.endsWith('/books/to-rollback')) {
          deleteCalled = true;
          return _json(200, '{"detail":"deleted"}');
        }
        if (options.method == 'GET' && options.path.endsWith('/books/')) {
          return _json(200, '[]');
        }
        return _json(500, '{"detail":"unexpected"}');
      });

      final container = ProviderContainer(overrides: [
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
        booksApiProvider
            .overrideWith((ref) => BooksApi(ref.watch(apiClientProvider))),
        appDatabaseProvider.overrideWithValue(db),
        localBookDocsRootProvider.overrideWithValue(blockingDir),
        pdfPageCounterProvider.overrideWithValue((_) async => 3),
      ]);
      addTearDown(container.dispose);

      await container.read(booksControllerProvider.future);

      await expectLater(
        container.read(booksControllerProvider.notifier).register(
              bytes: Uint8List.fromList(pdfBytes),
              filename: 'x.pdf',
              title: 'X',
            ),
        throwsA(anything),
      );

      expect(deleteCalled, isTrue,
          reason: 'failed local write should trigger server-side rollback');
      final rows = await db.select(db.books).get();
      expect(rows, isEmpty,
          reason: 'no drift row should be left for a failed register');
    },
  );
}

String _jsonOpt(Object? v) => v == null ? 'null' : '"$v"';
