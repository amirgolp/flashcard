import 'package:dio/dio.dart';

class ApiClient {
  ApiClient({required String baseUrl, String? Function()? tokenProvider})
      : _dio = Dio(BaseOptions(baseUrl: baseUrl)) {
    if (tokenProvider != null) {
      _dio.interceptors.add(
        InterceptorsWrapper(
          onRequest: (options, handler) {
            final token = tokenProvider();
            if (token != null) {
              options.headers['Authorization'] = 'Bearer $token';
            }
            handler.next(options);
          },
        ),
      );
    }
  }

  final Dio _dio;

  Dio get dio => _dio;
}
