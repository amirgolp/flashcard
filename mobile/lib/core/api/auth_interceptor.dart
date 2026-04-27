import 'dart:async';

import 'package:dio/dio.dart';

import 'token_store.dart';

/// Refreshes the auth token on 401, retrying the original request once.
/// Concurrent in-flight requests are queued behind a single refresh attempt
/// so we never fire multiple refreshes for the same expired token.
///
/// [refresh] returns the new access token, or `null` if refresh was not
/// possible (no refresh token, refresh endpoint failed, etc.). When
/// refresh fails the interceptor calls [onAuthInvalid] so the auth state
/// machine can transition to "logged out".
class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required this.tokenStore,
    required this.refresh,
    required this.onAuthInvalid,
    Dio? retryClient,
  }) : _retryClient = retryClient;

  final TokenStore tokenStore;
  final Future<String?> Function() refresh;
  final void Function() onAuthInvalid;

  /// Used to retry the original request *after* refresh, separate from the
  /// caller's Dio so we don't loop through this interceptor.
  Dio? _retryClient;
  Future<String?>? _inflightRefresh;

  void bindRetryClient(Dio dio) => _retryClient ??= dio;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (options.extra['skipAuth'] == true) {
      handler.next(options);
      return;
    }
    final token = await tokenStore.readAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final response = err.response;
    final retried = err.requestOptions.extra['__retried'] == true;
    if (response?.statusCode != 401 ||
        retried ||
        err.requestOptions.extra['skipAuth'] == true) {
      handler.next(err);
      return;
    }

    final newToken = await _refreshOnce();
    if (newToken == null) {
      onAuthInvalid();
      handler.next(err);
      return;
    }

    final retryDio = _retryClient;
    if (retryDio == null) {
      handler.next(err);
      return;
    }

    final original = err.requestOptions;
    original.extra['__retried'] = true;
    original.headers['Authorization'] = 'Bearer $newToken';

    try {
      final retryResponse = await retryDio.fetch<Object?>(original);
      handler.resolve(retryResponse);
    } on DioException catch (e) {
      handler.next(e);
    }
  }

  Future<String?> _refreshOnce() {
    final inflight = _inflightRefresh;
    if (inflight != null) return inflight;
    final future = refresh();
    _inflightRefresh = future;
    future.whenComplete(() => _inflightRefresh = null);
    return future;
  }
}
