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

  Future<Book> upload({
    required List<int> bytes,
    required String filename,
    required String title,
    String? targetLanguage,
    String? nativeLanguage,
    void Function(int sent, int total)? onProgress,
  }) async {
    final form = FormData.fromMap({
      'file': MultipartFile.fromBytes(bytes, filename: filename),
      'title': title,
      if (targetLanguage != null) 'target_language': targetLanguage,
      if (nativeLanguage != null) 'native_language': nativeLanguage,
    });
    try {
      final response = await _client.dio.post<Object?>(
        '/books/upload',
        data: form,
        onSendProgress: onProgress,
      );
      return decodeResponse(
        response,
        (data) => Book.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  /// Streams the PDF bytes for a book back to the caller. The result is
  /// stored in memory; for very large books a future rev should stream
  /// directly to disk.
  Future<List<int>> download(String id) async {
    try {
      final response = await _client.dio.get<List<int>>(
        '/books/$id/download',
        options: Options(responseType: ResponseType.bytes),
      );
      return response.data ?? const [];
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
