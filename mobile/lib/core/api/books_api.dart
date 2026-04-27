import 'package:dio/dio.dart';

import '../../shared/models/book.dart';
import '../../shared/models/json.dart';
import 'api_client.dart';
import 'api_exception.dart';

class BooksApi {
  BooksApi(this._client);

  final ApiClient _client;

  Future<List<Book>> list({int skip = 0, int limit = 100}) async {
    try {
      final response = await _client.dio.get<Object?>(
        '/books/',
        queryParameters: {'skip': skip, 'limit': limit},
      );
      return decodeResponse(response, (data) {
        final list = (data as List<Object?>?) ?? const [];
        return list
            .map((e) => Book.fromJson(e as JsonMap))
            .toList(growable: false);
      });
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<Book> get(String id) async {
    try {
      final response = await _client.dio.get<Object?>('/books/$id');
      return decodeResponse(
        response,
        (data) => Book.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  /// Registers a metadata-only book record on the server. The PDF
  /// itself stays on the client device; the server stores
  /// `storage_type='device'` and uses this record only as an anchor
  /// for cards and progress.
  Future<Book> create(BookCreate input) async {
    try {
      final response = await _client.dio.post<Object?>(
        '/books/',
        data: input.toJson(),
      );
      return decodeResponse(
        response,
        (data) => Book.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<Book> update(String id, BookUpdate input) async {
    try {
      final response = await _client.dio.put<Object?>(
        '/books/$id',
        data: input.toJson(),
      );
      return decodeResponse(
        response,
        (data) => Book.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<void> delete(String id) async {
    try {
      await _client.dio.delete<Object?>('/books/$id');
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<BookProgress> getProgress(String bookId) async {
    try {
      final response =
          await _client.dio.get<Object?>('/books/$bookId/progress');
      return decodeResponse(
        response,
        (data) => BookProgress.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<BookProgress> updateProgress(
    String bookId,
    BookProgressUpdate input,
  ) async {
    try {
      final response = await _client.dio.put<Object?>(
        '/books/$bookId/progress',
        data: input.toJson(),
      );
      return decodeResponse(
        response,
        (data) => BookProgress.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }
}

ApiException _toApi(DioException e) =>
    e.error is ApiException ? e.error! as ApiException : ApiException.fromDio(e);
