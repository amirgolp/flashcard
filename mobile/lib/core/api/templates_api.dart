import 'package:dio/dio.dart';

import '../../shared/models/json.dart';
import '../../shared/models/template.dart';
import 'api_client.dart';
import 'api_exception.dart';

class TemplatesApi {
  TemplatesApi(this._client);

  final ApiClient _client;

  Future<List<CardTemplate>> list({
    int skip = 0,
    int limit = 50,
    bool includeDefaults = true,
  }) async {
    try {
      final response = await _client.dio.get<Object?>(
        '/templates/',
        queryParameters: {
          'skip': skip,
          'limit': limit,
          'include_defaults': includeDefaults,
        },
      );
      return decodeResponse(response, (data) {
        final list = (data as List<Object?>?) ?? const [];
        return list
            .map((e) => CardTemplate.fromJson(e as JsonMap))
            .toList(growable: false);
      });
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<CardTemplate> get(String id) async {
    try {
      final response = await _client.dio.get<Object?>('/templates/$id');
      return decodeResponse(
        response,
        (data) => CardTemplate.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<CardTemplate> create(TemplateCreate input) async {
    try {
      final response = await _client.dio.post<Object?>(
        '/templates/',
        data: input.toJson(),
      );
      return decodeResponse(
        response,
        (data) => CardTemplate.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<CardTemplate> update(String id, TemplateUpdate input) async {
    try {
      final response = await _client.dio.put<Object?>(
        '/templates/$id',
        data: input.toJson(),
      );
      return decodeResponse(
        response,
        (data) => CardTemplate.fromJson(data as JsonMap),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<void> delete(String id) async {
    try {
      await _client.dio.delete<Object?>('/templates/$id');
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }
}

ApiException _toApi(DioException e) =>
    e.error is ApiException ? e.error! as ApiException : ApiException.fromDio(e);
