import 'package:dio/dio.dart';

import '../../shared/models/deck.dart';
import '../../shared/models/json.dart';
import 'api_client.dart';
import 'api_exception.dart';

class DecksApi {
  DecksApi(this._client);

  final ApiClient _client;

  Future<List<Deck>> list({int skip = 0, int limit = 100}) async {
    try {
      final response = await _client.dio.get<Object?>(
        '/decks/',
        queryParameters: {'skip': skip, 'limit': limit},
      );
      return decodeResponse(response, (data) {
        final list = (data as List<Object?>?) ?? const [];
        return list
            .map((e) => Deck.fromJson(e as JsonMap))
            .toList(growable: false);
      });
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<Deck> get(String id) async {
    try {
      final response = await _client.dio.get<Object?>('/decks/$id');
      return decodeResponse(
        response,
        (data) => Deck.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<Deck> create(DeckCreate input) async {
    try {
      final response = await _client.dio.post<Object?>(
        '/decks/',
        data: input.toJson(),
      );
      return decodeResponse(
        response,
        (data) => Deck.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<Deck> update(String id, DeckUpdate input) async {
    try {
      final response = await _client.dio.put<Object?>(
        '/decks/$id',
        data: input.toJson(),
      );
      return decodeResponse(
        response,
        (data) => Deck.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<void> delete(String id) async {
    try {
      await _client.dio.delete<Object?>('/decks/$id');
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }
}

ApiException _toApi(DioException e) =>
    e.error is ApiException ? e.error! as ApiException : ApiException.fromDio(e);
