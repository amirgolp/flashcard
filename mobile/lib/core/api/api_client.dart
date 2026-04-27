import 'package:dio/dio.dart';

import 'api_exception.dart';
import 'auth_interceptor.dart';
import 'token_store.dart';

/// The single Dio instance every service in the app shares. Two
/// interceptors are wired:
///
/// 1. [AuthInterceptor] — attaches `Bearer <token>` and refreshes on 401
/// 2. An error interceptor that converts every [DioException] to an
///    [ApiException] so callers don't need to know about Dio internals.
///
/// A separate "retry" Dio (no interceptors) is used internally by the
/// auth interceptor so retries don't loop through the same logic.
class ApiClient {
  ApiClient({
    required String baseUrl,
    required this.tokenStore,
    required Future<String?> Function() refresh,
    required void Function() onAuthInvalid,
    Duration connectTimeout = const Duration(seconds: 10),
    Duration receiveTimeout = const Duration(seconds: 30),
  })  : dio = _createDio(baseUrl, connectTimeout, receiveTimeout),
        _retryDio = _createDio(baseUrl, connectTimeout, receiveTimeout) {
    final auth = AuthInterceptor(
      tokenStore: tokenStore,
      refresh: refresh,
      onAuthInvalid: onAuthInvalid,
      retryClient: _retryDio,
    );
    dio.interceptors.add(auth);
    dio.interceptors.add(_ErrorMappingInterceptor());
  }

  final Dio dio;
  final Dio _retryDio;
  final TokenStore tokenStore;

  static Dio _createDio(
    String baseUrl,
    Duration connect,
    Duration receive,
  ) =>
      Dio(BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: connect,
        receiveTimeout: receive,
        headers: {'Accept': 'application/json'},
        responseType: ResponseType.json,
      ));
}

class _ErrorMappingInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: err.type,
        error: ApiException.fromDio(err),
        message: err.message,
      ),
    );
  }
}

/// Pull a typed payload out of a Dio response or throw [ApiException].
T decodeResponse<T>(Response<Object?> response, T Function(Object?) decode) {
  try {
    return decode(response.data);
  } on FormatException catch (e) {
    throw ApiException(
      message: 'Bad response shape: ${e.message}',
      statusCode: response.statusCode,
      cause: e,
    );
  }
}
