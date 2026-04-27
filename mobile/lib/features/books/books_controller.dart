import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/providers.dart';
import '../../shared/models/book.dart';

class BooksController extends AsyncNotifier<List<Book>> {
  @override
  Future<List<Book>> build() async => ref.read(booksApiProvider).list();

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => ref.read(booksApiProvider).list());
  }

  /// Uploads bytes to the backend, prepends the new book to the cache,
  /// and returns it.
  Future<Book> upload({
    required List<int> bytes,
    required String filename,
    required String title,
    String? targetLanguage,
    String? nativeLanguage,
    void Function(int sent, int total)? onProgress,
  }) async {
    final book = await ref.read(booksApiProvider).upload(
          bytes: bytes,
          filename: filename,
          title: title,
          targetLanguage: targetLanguage,
          nativeLanguage: nativeLanguage,
          onProgress: onProgress,
        );
    state = AsyncValue.data([book, ...?state.value]);
    return book;
  }

  Future<void> delete(String id) async {
    await ref.read(booksApiProvider).delete(id);
    final current = state.value ?? const [];
    state = AsyncValue.data([
      for (final b in current)
        if (b.id != id) b,
    ]);
  }
}

final booksControllerProvider =
    AsyncNotifierProvider<BooksController, List<Book>>(BooksController.new);

final bookByIdProvider =
    FutureProvider.family<Book, String>((ref, id) async {
  return ref.read(booksApiProvider).get(id);
});
