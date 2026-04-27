import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

/// Test override hook for [LocalBookStore]. Defaults to null, which
/// makes the store fall back to `getApplicationDocumentsDirectory()`.
/// Tests override this with a temporary directory so they don't need
/// the platform plugin to load.
final localBookDocsRootProvider = Provider<Directory?>((_) => null);

/// Where each user's PDFs live on the device.
///
/// One file per registered Book, named `<bookId>.pdf` so the local
/// drift row can recover the path from the server-assigned id alone.
class LocalBookStore {
  LocalBookStore._();

  /// Writes [bytes] to `<docsRoot>/books/<bookId>.pdf` and returns
  /// the absolute path. Creates the directory on first use. When
  /// [docsRoot] is null the platform's app-documents directory is
  /// used; tests pass a temporary dir.
  static Future<String> writeBookPdf({
    required String bookId,
    required Uint8List bytes,
    Directory? docsRoot,
  }) async {
    final dir = await _booksDir(docsRoot);
    final file = File(p.join(dir.path, '$bookId.pdf'));
    await file.writeAsBytes(bytes, flush: true);
    return file.path;
  }

  /// Best-effort cleanup, used to roll back a partially-completed
  /// register flow. Never throws.
  static Future<void> deleteBookPdf(
    String bookId, {
    Directory? docsRoot,
  }) async {
    try {
      final dir = await _booksDir(docsRoot);
      final file = File(p.join(dir.path, '$bookId.pdf'));
      if (await file.exists()) {
        await file.delete();
      }
    } on Object {
      // Cleanup is advisory.
    }
  }

  static Future<Directory> _booksDir(Directory? docsRoot) async {
    final docs = docsRoot ?? await getApplicationDocumentsDirectory();
    final dir = Directory(p.join(docs.path, 'books'));
    if (!await dir.exists()) {
      await dir.create(recursive: true);
    }
    return dir;
  }
}
