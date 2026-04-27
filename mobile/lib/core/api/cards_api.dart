import 'package:dio/dio.dart';

import '../../shared/models/card.dart';
import '../../shared/models/json.dart';
import 'api_client.dart';
import 'api_exception.dart';

class CardsApi {
  CardsApi(this._client);

  final ApiClient _client;

  Future<List<Card>> list({int skip = 0, int limit = 100}) async {
    try {
      final response = await _client.dio.get<Object?>(
        '/cards/',
        queryParameters: {'skip': skip, 'limit': limit},
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

  Future<Card> get(String id) async {
    try {
      final response = await _client.dio.get<Object?>('/cards/$id');
      return decodeResponse(
        response,
        (data) => Card.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<Card> create(CardCreate input) async {
    try {
      final response = await _client.dio.post<Object?>(
        '/cards/',
        data: input.toJson(),
      );
      return decodeResponse(
        response,
        (data) => Card.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<Card> update(String id, CardUpdate input) async {
    try {
      final response = await _client.dio.put<Object?>(
        '/cards/$id',
        data: input.toJson(),
      );
      return decodeResponse(
        response,
        (data) => Card.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<void> delete(String id) async {
    try {
      await _client.dio.delete<Object?>('/cards/$id');
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<List<Card>> search(String query, {String? cursor, int limit = 50}) async {
    try {
      final response = await _client.dio.get<Object?>(
        '/search/',
        queryParameters: stripNulls({
          'q': query,
          'cursor': cursor,
          'limit': limit,
        }),
      );
      return decodeResponse(response, (data) {
        if (data is List) {
          return data
              .map((e) => Card.fromJson(e as JsonMap))
              .toList(growable: false);
        }
        if (data is Map) {
          final results = (data as JsonMap)['results'];
          if (results is List) {
            return results
                .map((e) => Card.fromJson(e as JsonMap))
                .toList(growable: false);
          }
        }
        return const <Card>[];
      });
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }
}

ApiException _toApi(DioException e) =>
    e.error is ApiException ? e.error! as ApiException : ApiException.fromDio(e);
