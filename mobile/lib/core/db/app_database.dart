import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

part 'app_database.g.dart';

class Books extends Table {
  TextColumn get id => text()();
  TextColumn get title => text()();
  TextColumn get filePath => text()();
  IntColumn get totalPages => integer()();
  IntColumn get currentPage => integer().withDefault(const Constant(1))();
  DateTimeColumn get lastOpened => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

class CachedCards extends Table {
  TextColumn get id => text()();
  TextColumn get deckId => text().nullable()();
  TextColumn get front => text()();
  TextColumn get back => text()();
  TextColumn get hardnessLevel => text()();
  DateTimeColumn get nextReviewAt => dateTime().nullable()();
  DateTimeColumn get cachedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

/// Hardness updates that couldn't be sent to the backend yet (offline,
/// network error). Replayed by [CardCacheService.drainPending].
class PendingCardUpdates extends Table {
  TextColumn get cardId => text()();
  TextColumn get hardnessLevel => text()();
  DateTimeColumn get queuedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {cardId};
}

@DriftDatabase(tables: [Books, CachedCards, PendingCardUpdates])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  AppDatabase.forTesting(super.executor);

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        onUpgrade: (m, from, to) async {
          if (from < 2) {
            await m.addColumn(cachedCards, cachedCards.deckId);
            await m.addColumn(cachedCards, cachedCards.cachedAt);
            await m.createTable(pendingCardUpdates);
          }
        },
      );
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dir = await getApplicationDocumentsDirectory();
    final file = File(p.join(dir.path, 'flashcard.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
