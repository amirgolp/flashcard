import 'package:drift/native.dart';
import 'package:flashcard_mobile/core/db/app_database.dart';
import 'package:flashcard_mobile/core/db/card_cache_service.dart';
import 'package:flashcard_mobile/features/cards/review_cards_provider.dart';
import 'package:flashcard_mobile/features/decks/decks_controller.dart';
import 'package:flashcard_mobile/shared/models/card.dart';
import 'package:flashcard_mobile/shared/models/deck.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

/// Coverage for the issue #10 acceptance criterion "offline card
/// review capability": the review cards provider must serve the
/// network-fresh deck when online and the drift-cached deck when the
/// network call fails. drainPending is invoked on either path so any
/// queued offline edits sync.

Card _card(String id, {required HardnessLevel level}) => Card(
      id: id,
      front: 'q-$id',
      back: 'a-$id',
      hardnessLevel: level,
      dateCreated: DateTime.utc(2026, 4, 1),
      lastEdited: DateTime.utc(2026, 4, 1),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('returns network deck cards when the network call succeeds',
      () async {
    final db = AppDatabase.forTesting(NativeDatabase.memory());
    addTearDown(db.close);
    try {
      await db.customSelect('SELECT 1').get();
    } catch (e) {
      markTestSkipped('native sqlite unavailable: $e');
      return;
    }

    final container = ProviderContainer(overrides: [
      appDatabaseProvider.overrideWithValue(db),
      deckByIdProvider('deck-x').overrideWith((ref) async {
        return Deck(
          id: 'deck-x',
          name: 'X',
          cards: [
            _card('net-1', level: HardnessLevel.easy),
            _card('net-2', level: HardnessLevel.hard),
          ],
        );
      }),
    ]);
    addTearDown(container.dispose);

    final cards =
        await container.read(reviewCardsProvider('deck-x').future);
    expect(cards.map((c) => c.id), ['net-1', 'net-2']);
  });

  test('falls back to drift-cached cards when the network call fails',
      () async {
    final db = AppDatabase.forTesting(NativeDatabase.memory());
    addTearDown(db.close);
    try {
      await db.customSelect('SELECT 1').get();
    } catch (e) {
      markTestSkipped('native sqlite unavailable: $e');
      return;
    }

    // Pre-seed the offline cache via the snapshot path the live app uses.
    final cache = CardCacheService(db, () => null);
    await cache.snapshotDecks([
      Deck(
        id: 'deck-x',
        name: 'X',
        cards: [
          _card('cached-1', level: HardnessLevel.medium),
          _card('cached-2', level: HardnessLevel.easy),
        ],
      ),
    ]);

    final container = ProviderContainer(overrides: [
      appDatabaseProvider.overrideWithValue(db),
      // Network fails (e.g. offline / 503). The provider must
      // recover from the cache without surfacing the error.
      deckByIdProvider('deck-x').overrideWith((ref) async {
        throw StateError('simulated offline');
      }),
    ]);
    addTearDown(container.dispose);

    final cards =
        await container.read(reviewCardsProvider('deck-x').future);
    expect(cards.map((c) => c.id).toSet(), {'cached-1', 'cached-2'});
  });
}
