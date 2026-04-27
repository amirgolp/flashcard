import 'package:drift/native.dart';
import 'package:flashcard_mobile/core/db/app_database.dart';
import 'package:flashcard_mobile/core/db/card_cache_service.dart';
import 'package:flashcard_mobile/shared/models/card.dart';
import 'package:flashcard_mobile/shared/models/deck.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeCardsApi {
  _FakeCardsApi({this.failOn = const {}});

  final Set<String> failOn;
  final List<({String id, HardnessLevel level})> calls = [];

  Future<Card> update(String id, CardUpdate input) async {
    calls.add((id: id, level: input.hardnessLevel ?? HardnessLevel.medium));
    if (failOn.contains(id)) {
      throw Exception('simulated server error');
    }
    return Card(
      id: id,
      front: 'f',
      back: 'b',
      hardnessLevel: input.hardnessLevel ?? HardnessLevel.medium,
      dateCreated: DateTime.now(),
      lastEdited: DateTime.now(),
    );
  }
}

({AppDatabase db, _FakeCardsApi api, CardCacheService cache}) _makeStack(
    {Set<String> failOn = const {}}) {
  final db = AppDatabase.forTesting(NativeDatabase.memory());
  final api = _FakeCardsApi(failOn: failOn);
  final cache = CardCacheService(db, () => api);
  return (db: db, api: api, cache: cache);
}

void main() {
  test('snapshotDecks writes cards keyed by deck', () async {
    final stack = _makeStack();
    addTearDown(stack.db.close);

    try {
      stack.db.attachedDatabase;
    } catch (_) {
      // No-op probe to check whether sqlite is loadable.
    }
    try {
      await stack.db.customSelect('SELECT 1').get();
    } catch (e) {
      markTestSkipped('native sqlite unavailable: $e');
      return;
    }

    final deck = Deck(
      id: 'd1',
      name: 'Deck',
      cards: [
        Card(
          id: 'c1',
          front: 'q',
          back: 'a',
          hardnessLevel: HardnessLevel.medium,
          dateCreated: DateTime.now(),
          lastEdited: DateTime.now(),
        ),
      ],
    );
    await stack.cache.snapshotDecks([deck]);

    final cached = await stack.cache.cachedForDeck('d1');
    expect(cached, hasLength(1));
    expect(cached.single.front, 'q');
    expect(cached.single.hardnessLevel, HardnessLevel.medium);
  });

  test('recordHardness updates cache and queues sync; drain syncs', () async {
    final stack = _makeStack();
    addTearDown(stack.db.close);
    try {
      await stack.db.customSelect('SELECT 1').get();
    } catch (e) {
      markTestSkipped('native sqlite unavailable: $e');
      return;
    }

    await stack.cache.snapshotDecks([
      Deck(id: 'd1', name: 'D', cards: [
        Card(
          id: 'c1',
          front: 'q',
          back: 'a',
          hardnessLevel: HardnessLevel.medium,
          dateCreated: DateTime.now(),
          lastEdited: DateTime.now(),
        ),
      ])
    ]);

    await stack.cache.recordHardness('c1', HardnessLevel.hard);
    expect(await stack.cache.pendingCount(), 1);

    final cached = await stack.cache.cachedForDeck('d1');
    expect(cached.single.hardnessLevel, HardnessLevel.hard,
        reason: 'cache updates optimistically before sync');

    final synced = await stack.cache.drainPending();
    expect(synced, 1);
    expect(stack.api.calls.single.id, 'c1');
    expect(stack.api.calls.single.level, HardnessLevel.hard);
    expect(await stack.cache.pendingCount(), 0);
  });

  test('drainPending stops on first failure and leaves rest queued',
      () async {
    final stack = _makeStack(failOn: {'c2'});
    addTearDown(stack.db.close);
    try {
      await stack.db.customSelect('SELECT 1').get();
    } catch (e) {
      markTestSkipped('native sqlite unavailable: $e');
      return;
    }

    await stack.cache.snapshotDecks([
      Deck(id: 'd1', name: 'D', cards: [
        Card(
          id: 'c1',
          front: '1',
          back: '1',
          hardnessLevel: HardnessLevel.medium,
          dateCreated: DateTime.now(),
          lastEdited: DateTime.now(),
        ),
        Card(
          id: 'c2',
          front: '2',
          back: '2',
          hardnessLevel: HardnessLevel.medium,
          dateCreated: DateTime.now(),
          lastEdited: DateTime.now(),
        ),
        Card(
          id: 'c3',
          front: '3',
          back: '3',
          hardnessLevel: HardnessLevel.medium,
          dateCreated: DateTime.now(),
          lastEdited: DateTime.now(),
        ),
      ])
    ]);
    await stack.cache.recordHardness('c1', HardnessLevel.easy);
    await stack.cache.recordHardness('c2', HardnessLevel.hard);
    await stack.cache.recordHardness('c3', HardnessLevel.easy);

    final synced = await stack.cache.drainPending();
    expect(synced, 1, reason: 'c1 succeeded; c2 failed and stopped the drain');
    expect(await stack.cache.pendingCount(), 2,
        reason: 'c2 + c3 still queued for next attempt');
  });
}
