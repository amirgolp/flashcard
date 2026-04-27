import 'package:dio/dio.dart';
import 'package:flashcard_mobile/core/api/auth_interceptor.dart';
import 'package:flashcard_mobile/core/api/token_store.dart';
import 'package:flutter_test/flutter_test.dart';

class _StubAdapter implements HttpClientAdapter {
  _StubAdapter(this._respond);

  final ResponseBody Function(RequestOptions options) _respond;
  int callCount = 0;

  @override
  void close({bool force = false}) {}

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<List<int>>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    callCount += 1;
    return _respond(options);
  }
}

ResponseBody _jsonOk() => ResponseBody.fromString(
      '{"ok":true}',
      200,
      headers: {
        'content-type': ['application/json'],
      },
    );

ResponseBody _unauthorized() => ResponseBody.fromString(
      '{"detail":"token expired"}',
      401,
      headers: {
        'content-type': ['application/json'],
      },
    );

void main() {
  late InMemoryTokenStore store;

  setUp(() {
    store = InMemoryTokenStore();
  });

  test('attaches Bearer header when token is present', () async {
    await store.save(accessToken: 'abc');
    String? captured;
    final adapter = _StubAdapter((options) {
      captured = options.headers['Authorization'] as String?;
      return _jsonOk();
    });

    final dio = Dio()..httpClientAdapter = adapter;
    dio.interceptors.add(AuthInterceptor(
      tokenStore: store,
      refresh: () async => null,
      onAuthInvalid: () {},
      retryClient: dio,
    ));

    await dio.get<Object?>('https://api.example.test/x');
    expect(captured, 'Bearer abc');
  });

  test('skips auth header when extra.skipAuth is true', () async {
    await store.save(accessToken: 'abc');
    String? captured;
    final adapter = _StubAdapter((options) {
      captured = options.headers['Authorization'] as String?;
      return _jsonOk();
    });

    final dio = Dio()..httpClientAdapter = adapter;
    dio.interceptors.add(AuthInterceptor(
      tokenStore: store,
      refresh: () async => null,
      onAuthInvalid: () {},
      retryClient: dio,
    ));

    await dio.get<Object?>(
      'https://api.example.test/x',
      options: Options(extra: const {'skipAuth': true}),
    );
    expect(captured, isNull);
  });

  test('refreshes once on 401, retries with the new token', () async {
    await store.save(accessToken: 'old');
    var refreshCalls = 0;
    final adapter = _StubAdapter((options) {
      final auth = options.headers['Authorization'] as String?;
      if (auth == 'Bearer new') return _jsonOk();
      return _unauthorized();
    });

    final dio = Dio()..httpClientAdapter = adapter;
    dio.interceptors.add(AuthInterceptor(
      tokenStore: store,
      refresh: () async {
        refreshCalls += 1;
        await store.save(accessToken: 'new');
        return 'new';
      },
      onAuthInvalid: () {},
      retryClient: dio,
    ));

    final response = await dio.get<Object?>('https://api.example.test/x');
    expect(response.statusCode, 200);
    expect(refreshCalls, 1);
    expect(adapter.callCount, 2); // first 401 then retry
  });

  test('fires onAuthInvalid when refresh returns null', () async {
    await store.save(accessToken: 'old');
    var invalidated = 0;
    final adapter = _StubAdapter((_) => _unauthorized());

    final dio = Dio()..httpClientAdapter = adapter;
    dio.interceptors.add(AuthInterceptor(
      tokenStore: store,
      refresh: () async => null,
      onAuthInvalid: () => invalidated += 1,
      retryClient: dio,
    ));

    await expectLater(
      dio.get<Object?>('https://api.example.test/x'),
      throwsA(isA<DioException>()),
    );
    expect(invalidated, 1);
  });

  test('coalesces concurrent 401s into a single refresh', () async {
    await store.save(accessToken: 'old');
    var refreshCalls = 0;
    final adapter = _StubAdapter((options) {
      final auth = options.headers['Authorization'] as String?;
      if (auth == 'Bearer new') return _jsonOk();
      return _unauthorized();
    });

    final dio = Dio()..httpClientAdapter = adapter;
    dio.interceptors.add(AuthInterceptor(
      tokenStore: store,
      refresh: () async {
        refreshCalls += 1;
        await Future<void>.delayed(const Duration(milliseconds: 30));
        await store.save(accessToken: 'new');
        return 'new';
      },
      onAuthInvalid: () {},
      retryClient: dio,
    ));

    final results = await Future.wait([
      dio.get<Object?>('https://api.example.test/a'),
      dio.get<Object?>('https://api.example.test/b'),
      dio.get<Object?>('https://api.example.test/c'),
    ]);
    expect(results.every((r) => r.statusCode == 200), isTrue);
    expect(refreshCalls, 1);
  });
}
