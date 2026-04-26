import 'package:drift/native.dart';
import 'package:flashcard_mobile/core/db/app_database.dart';
import 'package:flutter_test/flutter_test.dart';

// sqlite3_flutter_libs ships a libsqlite3 binary built against modern glibc.
// On older Linux dev hosts it fails to load. Tests below probe sqlite first
// and call markTestSkipped() rather than failing — CI runs on a recent
// Ubuntu image where the bundled binary loads cleanly.
Future<AppDatabase?> _openOrSkip() async {
  try {
    final db = AppDatabase.forTesting(NativeDatabase.memory());
    await db.customSelect('SELECT 1').get();
    return db;
  } catch (e) {
    markTestSkipped('native sqlite unavailable on this host: $e');
    return null;
  }
}

void main() {
  test('inserts and reads a Book row', () async {
    final db = await _openOrSkip();
    if (db == null) return;
    addTearDown(db.close);

    await db.into(db.books).insert(
          BooksCompanion.insert(
            id: 'b1',
            title: 'A History of Ideas',
            filePath: '/sdcard/Books/history.pdf',
            totalPages: 320,
          ),
        );

    final books = await db.select(db.books).get();
    expect(books, hasLength(1));
    expect(books.single.title, 'A History of Ideas');
    expect(books.single.currentPage, 1); // default
  });

  test('CachedCards primary key prevents duplicates', () async {
    final db = await _openOrSkip();
    if (db == null) return;
    addTearDown(db.close);

    final card = CachedCardsCompanion.insert(
      id: 'c1',
      front: 'Q',
      back: 'A',
      hardnessLevel: 'easy',
    );
    await db.into(db.cachedCards).insert(card);
    await expectLater(
      db.into(db.cachedCards).insert(card),
      throwsA(isA<Exception>()),
    );
  });
}
