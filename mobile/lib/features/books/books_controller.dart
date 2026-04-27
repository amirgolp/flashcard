import 'dart:typed_data';

import 'package:drift/drift.dart' show Value;
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/providers.dart';
import '../../core/db/app_database.dart' show BooksCompanion;
import '../../core/db/card_cache_service.dart';
import '../../core/pdf/pdf_metadata.dart';
import '../../shared/models/book.dart';
import 'local_book_store.dart';

class BooksController extends AsyncNotifier<List<Book>> {
  @override
  Future<List<Book>> build() async => _loadWithDriftFallback();

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_loadWithDriftFallback);
  }

  /// Fetches the canonical list from the server, falling back to the
  /// drift-indexed Books table when the network is unavailable. Drift
  /// rows carry only `id / title / total_pages / file_path` (the
  /// fields the device-only register flow persists), so when offline
  /// language/chapter/timestamp metadata are returned as their
  /// defaults — enough for the user to navigate to a deck and
  /// continue reviewing.
  Future<List<Book>> _loadWithDriftFallback() async {
    try {
      return await ref.read(booksApiProvider).list();
    } on Object {
      final db = ref.read(appDatabaseProvider);
      final rows = await db.select(db.books).get();
      final epoch = DateTime.fromMillisecondsSinceEpoch(0);
      return rows
          .map((r) => Book(
                id: r.id,
                title: r.title,
                filename: '',
                totalPages: r.totalPages,
                dateCreated: epoch,
                lastEdited: epoch,
              ))
          .toList(growable: false);
    }
  }

  /// Registers a book whose PDF lives on the device.
  ///
  /// Order: derive page count from the bytes, POST metadata to the
  /// server (returns the canonical book id), persist the bytes to
  /// `<appDocs>/books/<id>.pdf`, then index the book locally in
  /// drift. If the local steps fail after the server insert, the book
  /// record is rolled back so the server doesn't keep an orphan.
  Future<Book> register({
    required Uint8List bytes,
    required String filename,
    required String title,
    String? targetLanguage,
    String? nativeLanguage,
  }) async {
    final pageCount = await ref.read(pdfPageCounterProvider)(bytes);
    final api = ref.read(booksApiProvider);

    final book = await api.create(
      BookCreate(
        title: title,
        totalPages: pageCount,
        filename: filename,
        targetLanguage: targetLanguage,
        nativeLanguage: nativeLanguage,
      ),
    );

    final docsRoot = ref.read(localBookDocsRootProvider);
    try {
      final filePath = await LocalBookStore.writeBookPdf(
        bookId: book.id,
        bytes: bytes,
        docsRoot: docsRoot,
      );

      final db = ref.read(appDatabaseProvider);
      await db.into(db.books).insertOnConflictUpdate(
            BooksCompanion.insert(
              id: book.id,
              title: book.title,
              filePath: filePath,
              totalPages: book.totalPages,
              currentPage: const Value(1),
            ),
          );
    } on Object {
      await LocalBookStore.deleteBookPdf(book.id, docsRoot: docsRoot);
      try {
        await api.delete(book.id);
      } on Object {
        // Best-effort rollback only.
      }
      rethrow;
    }

    state = AsyncValue.data([book, ...?state.value]);
    return book;
  }

  Future<void> delete(String id) async {
    await ref.read(booksApiProvider).delete(id);
    await LocalBookStore.deleteBookPdf(
      id,
      docsRoot: ref.read(localBookDocsRootProvider),
    );
    final db = ref.read(appDatabaseProvider);
    await (db.delete(db.books)..where((b) => b.id.equals(id))).go();
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
