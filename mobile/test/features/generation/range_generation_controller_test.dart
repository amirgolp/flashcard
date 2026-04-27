import 'package:dio/dio.dart';
import 'package:drift/drift.dart' show Value;
import 'package:drift/native.dart';
import 'package:flashcard_mobile/core/api/api_client.dart';
import 'package:flashcard_mobile/core/api/generation_api.dart';
import 'package:flashcard_mobile/core/api/providers.dart';
import 'package:flashcard_mobile/core/api/token_store.dart';
import 'package:flashcard_mobile/core/auth/auth_service.dart';
import 'package:flashcard_mobile/core/db/app_database.dart';
import 'package:flashcard_mobile/core/db/card_cache_service.dart';
import 'package:flashcard_mobile/features/generation/pdf_page_renderer.dart';
import 'package:flashcard_mobile/features/generation/range_generation_controller.dart';
import 'package:flashcard_mobile/shared/models/image_generation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

/// Coverage for the device-only page-range generation flow:
/// the controller must look up the book's local PDF path in drift,
/// invoke the renderer once for the supplied range, and forward the
/// produced [ImagePart]s to `/generate/from-images`.
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
    'generate looks up filePath, renders pages 5..7, and posts the batch',
    () async {
      final db = AppDatabase.forTesting(NativeDatabase.memory());
      addTearDown(db.close);
      try {
        await db.customSelect('SELECT 1').get();
      } catch (e) {
        markTestSkipped('native sqlite unavailable: $e');
        return;
      }

      // Pre-populate drift with a book whose local file lives at a
      // known path. The path doesn't need to exist; the renderer is
      // stubbed.
      await db.into(db.books).insert(
            BooksCompanion.insert(
              id: 'book-1',
              title: 'Sample',
              filePath: '/tmp/fake-books/book-1.pdf',
              totalPages: 100,
              currentPage: const Value(1),
            ),
          );

      var rendererCalls = 0;
      late String capturedPath;
      late int capturedStart;
      late int capturedEnd;
      final stubRenderer = StubPdfPageRenderer((
              {required String filePath,
              required int startPage,
              required int endPage,
              int maxDimension = 1600,
              int jpegQuality = 80}) async {
        rendererCalls += 1;
        capturedPath = filePath;
        capturedStart = startPage;
        capturedEnd = endPage;
        return [
          for (var p = startPage; p <= endPage; p++)
            ImagePart(
              imageBase64: 'aGVsbG8=', // "hello", base64
              sourcePage: p,
            ),
        ];
      });

      final stub = _Stub((options) {
        if (options.method == 'POST' &&
            options.path.endsWith('/generate/from-images')) {
          return _json(
            200,
            '{"batch_id":"batch-42",'
            '"drafts":[],'
            '"pages_processed":{"start":5,"end":7},'
            '"message":"Generated 0 cards from 3 image(s)"}',
          );
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
        generationApiProvider
            .overrideWith((ref) => GenerationApi(ref.watch(apiClientProvider))),
        appDatabaseProvider.overrideWithValue(db),
        pdfPageRendererProvider.overrideWithValue(stubRenderer),
      ]);
      addTearDown(container.dispose);

      final result =
          await container.read(rangeGenerationControllerProvider).generate(
                bookId: 'book-1',
                startPage: 5,
                endPage: 7,
                numCards: 12,
              );

      expect(rendererCalls, 1);
      expect(capturedPath, '/tmp/fake-books/book-1.pdf');
      expect(capturedStart, 5);
      expect(capturedEnd, 7);

      // Single POST went out with the full batch payload.
      final post = stub.requests.firstWhere((r) =>
          r.method == 'POST' && r.path.endsWith('/generate/from-images'));
      final body = post.data as Map<String, Object?>;
      expect(body['book_id'], 'book-1');
      expect(body['num_cards'], 12);
      final images = body['images'] as List<Object?>;
      expect(images, hasLength(3));
      final first = images.first as Map<String, Object?>;
      expect(first['source_page'], 5);
      expect(first['image_base64'], 'aGVsbG8=');
      expect(first['mime_type'], 'image/jpeg');

      expect(result.batchId, 'batch-42');
      expect(result.pageCount, 3);
      expect(result.message, contains('3 image'));
    },
  );

  test(
    'generate throws when no local PDF is registered for the book',
    () async {
      final db = AppDatabase.forTesting(NativeDatabase.memory());
      addTearDown(db.close);
      try {
        await db.customSelect('SELECT 1').get();
      } catch (e) {
        markTestSkipped('native sqlite unavailable: $e');
        return;
      }

      // Drift is empty — controller should refuse without ever
      // touching the renderer or the network.
      var rendererCalls = 0;
      final stubRenderer = StubPdfPageRenderer((
              {required String filePath,
              required int startPage,
              required int endPage,
              int maxDimension = 1600,
              int jpegQuality = 80}) async {
        rendererCalls += 1;
        return const [];
      });

      final stub = _Stub((_) => _json(500, '{"detail":"should not hit"}'));

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
        generationApiProvider
            .overrideWith((ref) => GenerationApi(ref.watch(apiClientProvider))),
        appDatabaseProvider.overrideWithValue(db),
        pdfPageRendererProvider.overrideWithValue(stubRenderer),
      ]);
      addTearDown(container.dispose);

      await expectLater(
        container.read(rangeGenerationControllerProvider).generate(
              bookId: 'missing',
              startPage: 1,
              endPage: 3,
            ),
        throwsA(isA<StateError>()),
      );
      expect(rendererCalls, 0);
      expect(stub.requests, isEmpty);
    },
  );

  test('generate rejects an inverted range without touching anything',
      () async {
    final db = AppDatabase.forTesting(NativeDatabase.memory());
    addTearDown(db.close);
    try {
      await db.customSelect('SELECT 1').get();
    } catch (e) {
      markTestSkipped('native sqlite unavailable: $e');
      return;
    }

    var rendererCalls = 0;
    final stubRenderer = StubPdfPageRenderer((
            {required String filePath,
            required int startPage,
            required int endPage,
            int maxDimension = 1600,
            int jpegQuality = 80}) async {
      rendererCalls += 1;
      return const [];
    });
    final stub = _Stub((_) => _json(500, '{"detail":"should not hit"}'));

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
      generationApiProvider
          .overrideWith((ref) => GenerationApi(ref.watch(apiClientProvider))),
      appDatabaseProvider.overrideWithValue(db),
      pdfPageRendererProvider.overrideWithValue(stubRenderer),
    ]);
    addTearDown(container.dispose);

    await expectLater(
      container.read(rangeGenerationControllerProvider).generate(
            bookId: 'book-1',
            startPage: 8,
            endPage: 5,
          ),
      throwsA(isA<ArgumentError>()),
    );
    expect(rendererCalls, 0);
    expect(stub.requests, isEmpty);
  });
}
