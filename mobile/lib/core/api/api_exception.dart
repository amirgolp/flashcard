import 'package:dio/dio.dart';

import '../../shared/models/json.dart';

/// Domain-level exception thrown by all API service methods. Wraps a
/// [DioException] with a usable status code, a flattened error message,
/// and a list of validation errors when the backend returns a 400/422.
class ApiException implements Exception {
  ApiException({
    required this.message,
    this.statusCode,
    this.validationErrors = const [],
    this.cause,
  });

  final int? statusCode;
  final String message;
  final List<ValidationError> validationErrors;
  final Object? cause;

  bool get isUnauthorized => statusCode == 401;
  bool get isNotFound => statusCode == 404;
  bool get isValidation =>
      statusCode == 400 || statusCode == 422 || validationErrors.isNotEmpty;
  bool get isServerError => statusCode != null && statusCode! >= 500;
  bool get isNetwork => statusCode == null;

  factory ApiException.fromDio(DioException e) {
    final response = e.response;
    if (response == null) {
      return ApiException(
        message: _networkMessage(e),
        cause: e,
      );
    }

    final data = response.data;
    String message = 'Request failed (${response.statusCode})';
    final errors = <ValidationError>[];

    if (data is Map) {
      final detail = data['detail'];
      if (detail is String) {
        message = detail;
      } else if (detail is List) {
        for (final entry in detail) {
          if (entry is Map) {
            errors.add(ValidationError.fromJson(entry.cast<String, Object?>()));
          }
        }
        if (errors.isNotEmpty) {
          message = errors.map((e) => e.summary).join('; ');
        }
      } else if (detail is Map) {
        final msg = detail['msg'];
        if (msg is String) message = msg;
      }
    } else if (data is String && data.isNotEmpty) {
      message = data;
    }

    return ApiException(
      message: message,
      statusCode: response.statusCode,
      validationErrors: errors,
      cause: e,
    );
  }

  static String _networkMessage(DioException e) => switch (e.type) {
        DioExceptionType.connectionTimeout =>
          'Connection timed out — check your network.',
        DioExceptionType.sendTimeout => 'Upload timed out — try again.',
        DioExceptionType.receiveTimeout =>
          'Server is taking too long to respond.',
        DioExceptionType.badCertificate =>
          'Could not verify the server certificate.',
        DioExceptionType.connectionError =>
          'Could not reach the server — are you online?',
        DioExceptionType.cancel => 'Request was cancelled.',
        DioExceptionType.unknown => e.error?.toString() ?? 'Unknown error.',
        _ => e.message ?? 'Unknown error.',
      };

  @override
  String toString() => 'ApiException(${statusCode ?? 'no-status'}): $message';
}

class ValidationError {
  const ValidationError({required this.location, required this.message});

  final String location;
  final String message;

  String get summary => location.isEmpty ? message : '$location: $message';

  factory ValidationError.fromJson(JsonMap json) {
    final loc = json['loc'];
    final locParts = <String>[];
    if (loc is List) {
      for (final part in loc) {
        if (part is String && part != 'body') locParts.add(part);
      }
    }
    return ValidationError(
      location: locParts.join('.'),
      message: (json['msg'] as String?) ?? 'invalid value',
    );
  }
}
