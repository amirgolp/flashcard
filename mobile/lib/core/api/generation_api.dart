import 'package:dio/dio.dart';

import '../../shared/models/card.dart';
import '../../shared/models/draft_card.dart';
import '../../shared/models/generation.dart';
import '../../shared/models/json.dart';
import 'api_client.dart';
import 'api_exception.dart';

class GenerationApi {
  GenerationApi(this._client);

  final ApiClient _client;

  Future<GenerationResponse> nextBatch(GenerateNextBatchRequest input) async {
    try {
      final response = await _client.dio.post<Object?>(
        '/generate/next-batch',
        data: input.toJson(),
      );
      return decodeResponse(
        response,
        (data) => GenerationResponse.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<GenerationResponse> fromRange(GenerateFromRangeRequest input) async {
    try {
      final response = await _client.dio.post<Object?>(
        '/generate/from-range',
        data: input.toJson(),
      );
      return decodeResponse(
        response,
        (data) => GenerationResponse.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<List<DraftCard>> listDrafts({
    String? bookId,
    String? batchId,
    String status = 'pending',
    int skip = 0,
    int limit = 50,
  }) async {
    try {
      final response = await _client.dio.get<Object?>(
        '/generate/drafts',
        queryParameters: stripNulls({
          'book_id': bookId,
          'batch_id': batchId,
          'status': status,
          'skip': skip,
          'limit': limit,
        }),
      );
      return decodeResponse(response, (data) {
        final list = (data as List<Object?>?) ?? const [];
        return list
            .map((e) => DraftCard.fromJson(e as JsonMap))
            .toList(growable: false);
      });
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<DraftCard> updateDraft(String id, DraftCardUpdate input) async {
    try {
      final response = await _client.dio.put<Object?>(
        '/generate/drafts/$id',
        data: input.toJson(),
      );
      return decodeResponse(
        response,
        (data) => DraftCard.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<Card> approveDraft(String id, {String? deckId}) async {
    try {
      final response = await _client.dio.post<Object?>(
        '/generate/drafts/$id/approve',
        queryParameters: stripNulls({'deck_id': deckId}),
      );
      return decodeResponse(
        response,
        (data) => Card.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<List<Card>> bulkApprove(BulkApproveRequest input) async {
    try {
      final response = await _client.dio.post<Object?>(
        '/generate/drafts/bulk-approve',
        data: input.toJson(),
      );
      return decodeResponse(response, (data) {
        final list = (data as List<Object?>?) ?? const [];
        return list
            .map((e) => Card.fromJson(e as JsonMap))
            .toList(growable: false);
      });
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<void> rejectDraft(String id) async {
    try {
      await _client.dio.post<Object?>('/generate/drafts/$id/reject');
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<int> cleanupRejected({String? bookId}) async {
    try {
      final response = await _client.dio.delete<Object?>(
        '/generate/drafts/rejected',
        queryParameters: stripNulls({'book_id': bookId}),
      );
      final data = response.data;
      if (data is Map) {
        final detail = data['detail'];
        if (detail is String) {
          final match = RegExp(r'(\d+)').firstMatch(detail);
          if (match != null) return int.parse(match.group(1)!);
        }
      }
      return 0;
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }
}

ApiException _toApi(DioException e) =>
    e.error is ApiException ? e.error! as ApiException : ApiException.fromDio(e);
