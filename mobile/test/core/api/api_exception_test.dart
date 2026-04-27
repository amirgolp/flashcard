import 'package:dio/dio.dart';
import 'package:flashcard_mobile/core/api/api_exception.dart';
import 'package:flutter_test/flutter_test.dart';

DioException _withResponse(int status, Object? body) {
  final options = RequestOptions(path: '/x');
  return DioException(
    requestOptions: options,
    response: Response<Object?>(
      requestOptions: options,
      data: body,
      statusCode: status,
    ),
    type: DioExceptionType.badResponse,
  );
}

void main() {
  test('parses string detail (e.g. 400 from /auth/register)', () {
    final api = ApiException.fromDio(
      _withResponse(400, {'detail': 'Email already registered'}),
    );
    expect(api.statusCode, 400);
    expect(api.message, 'Email already registered');
    expect(api.isValidation, isTrue);
    expect(api.validationErrors, isEmpty);
  });

  test('parses pydantic validation error list', () {
    final api = ApiException.fromDio(_withResponse(400, {
      'detail': [
        {
          'type': 'value_error',
          'loc': ['body', 'email'],
          'msg': 'value is not a valid email address',
        },
        {
          'type': 'string_too_short',
          'loc': ['body', 'password'],
          'msg': 'String should have at least 8 characters',
        },
      ],
    }));
    expect(api.validationErrors, hasLength(2));
    expect(api.validationErrors.first.location, 'email');
    expect(api.message, contains('email: value is not a valid email address'));
    expect(api.message, contains('password: String should have at least 8'));
    expect(api.isValidation, isTrue);
  });

  test('connection error has null statusCode and isNetwork=true', () {
    final api = ApiException.fromDio(DioException(
      requestOptions: RequestOptions(path: '/x'),
      type: DioExceptionType.connectionError,
      error: 'no route to host',
    ));
    expect(api.statusCode, isNull);
    expect(api.isNetwork, isTrue);
    expect(api.message, contains('Could not reach the server'));
  });

  test('isUnauthorized for 401', () {
    final api = ApiException.fromDio(
      _withResponse(401, {'detail': 'token expired'}),
    );
    expect(api.isUnauthorized, isTrue);
  });
}
