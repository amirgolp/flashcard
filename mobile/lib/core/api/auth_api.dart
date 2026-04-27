import 'package:dio/dio.dart';

import '../../shared/models/json.dart';
import '../../shared/models/user.dart';
import 'api_client.dart';
import 'api_exception.dart';

/// Username/password auth against the FastAPI backend. Used by tests and
/// as a fallback while OIDC is not yet wired.
class AuthApi {
  AuthApi(this._client);

  final ApiClient _client;

  Future<User> register(RegisterRequest request) async {
    try {
      final response = await _client.dio.post<Object?>(
        '/auth/register',
        data: request.toJson(),
        options: Options(extra: const {'skipAuth': true}),
      );
      return decodeResponse(
        response,
        (data) => User.fromJson((data as JsonMap?) ?? const {}),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  /// FastAPI's /auth/login uses OAuth2PasswordRequestForm — i.e. it expects
  /// `application/x-www-form-urlencoded` with `username` and `password`.
  Future<AuthToken> login({
    required String username,
    required String password,
  }) async {
    try {
      final response = await _client.dio.post<Object?>(
        '/auth/login',
        data: {'username': username, 'password': password},
        options: Options(
          contentType: Headers.formUrlEncodedContentType,
          extra: const {'skipAuth': true},
        ),
      );
      return decodeResponse(
        response,
        (data) => AuthToken.fromJson((data as JsonMap?) ?? const {}),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }
}

ApiException _toApi(DioException e) =>
    e.error is ApiException ? e.error! as ApiException : ApiException.fromDio(e);
