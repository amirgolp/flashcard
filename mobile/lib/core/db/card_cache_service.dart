import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/models/card.dart' as model;
import '../../shared/models/deck.dart';
import '../api/providers.dart';
import 'app_database.dart';

/// Bridges the network-backed [CardsApi] with the local [AppDatabase]
/// so the review flow keeps working offline.
///
/// Responsibilities:
/// - Snapshot a list of decks/cards into drift on demand (after a
///   successful network read in slice 4).
/// - Read cached cards back keyed by deck.
/// - Apply optimistic hardness updates locally and queue them for
///   replay against the server.
/// - Drain the queued updates when the network is reachable.
class CardCacheService {
  CardCacheService(this._db, this._readCardsApi);

  final AppDatabase _db;
  final dynamic Function() _readCardsApi;

  Future<void> snapshotDecks(List<Deck> decks) async {
    await _db.transaction(() async {
      // Replace cached cards with the latest snapshot. We keep all cards
      // ever seen so an offline user can still review previously-cached
      // cards even if the deck was just refreshed without them.
      for (final deck in decks) {
        for (final card in deck.cards) {
          await _db.into(_db.cachedCards).insertOnConflictUpdate(
                CachedCardsCompanion.insert(
                  id: card.id,
                  deckId: Value(deck.id),
                  front: card.front,
                  back: card.back,
                  hardnessLevel: card.hardnessLevel.wire,
                  nextReviewAt: Value(card.lastVisited),
                ),
              );
        }
      }
    });
  }

  Future<List<model.Card>> cachedForDeck(String deckId) async {
    final rows = await (_db.select(_db.cachedCards)
          ..where((c) => c.deckId.equals(deckId))
          ..orderBy([(c) => OrderingTerm(expression: c.cachedAt)]))
        .get();
    return rows.map(_rowToCard).toList(growable: false);
  }

  /// Optimistically updates the cached row and enqueues the server-side
  /// update for replay. Safe to call when offline — the API call will
  /// be retried by [drainPending].
  Future<void> recordHardness(String cardId, model.HardnessLevel level) async {
    await _db.transaction(() async {
      await (_db.update(_db.cachedCards)..where((c) => c.id.equals(cardId)))
          .write(CachedCardsCompanion(hardnessLevel: Value(level.wire)));
      await _db.into(_db.pendingCardUpdates).insertOnConflictUpdate(
            PendingCardUpdatesCompanion.insert(
              cardId: cardId,
              hardnessLevel: level.wire,
            ),
          );
    });
  }

  /// Replays pending updates against the server. Successful updates are
  /// removed from the queue; the first failure short-circuits the rest
  /// so we don't spam a flaky network. Returns the number of updates
  /// that successfully synced.
  Future<int> drainPending() async {
    final pending = await _db.select(_db.pendingCardUpdates).get();
    if (pending.isEmpty) return 0;

    final api = _readCardsApi();
    var synced = 0;
    for (final entry in pending) {
      try {
        await api.update(
          entry.cardId,
          model.CardUpdate(
              hardnessLevel: model.HardnessLevel.fromWire(entry.hardnessLevel)),
        );
        await (_db.delete(_db.pendingCardUpdates)
              ..where((p) => p.cardId.equals(entry.cardId)))
            .go();
        synced += 1;
      } on Object {
        return synced;
      }
    }
    return synced;
  }

  Future<int> pendingCount() async {
    final rows = await _db.select(_db.pendingCardUpdates).get();
    return rows.length;
  }

  static model.Card _rowToCard(CachedCard row) => model.Card(
        id: row.id,
        front: row.front,
        back: row.back,
        hardnessLevel: model.HardnessLevel.fromWire(row.hardnessLevel),
        dateCreated: row.cachedAt,
        lastEdited: row.cachedAt,
        lastVisited: row.nextReviewAt,
      );
}

final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(db.close);
  return db;
});

final cardCacheServiceProvider = Provider<CardCacheService>((ref) {
  final db = ref.watch(appDatabaseProvider);
  return CardCacheService(db, () => ref.read(cardsApiProvider));
});
