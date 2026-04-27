import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/providers.dart';
import '../../core/db/card_cache_service.dart';
import '../../shared/models/deck.dart';

/// Owns the list of decks for the signed-in user. Uses [AsyncValue] so
/// the UI can render loading/data/error in one switch.
class DecksController extends AsyncNotifier<List<Deck>> {
  @override
  Future<List<Deck>> build() async {
    final decks = await ref.read(decksApiProvider).list();
    _snapshotInBackground(decks);
    return decks;
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final decks = await ref.read(decksApiProvider).list();
      _snapshotInBackground(decks);
      return decks;
    });
  }

  void _snapshotInBackground(List<Deck> decks) {
    // Best-effort cache write — never block the UI on it.
    Future<void>(() async {
      try {
        await ref.read(cardCacheServiceProvider).snapshotDecks(decks);
      } on Object {
        // Cache failures are non-fatal; the UI keeps the in-memory copy.
      }
    });
  }

  Future<Deck> create(DeckCreate input) async {
    final api = ref.read(decksApiProvider);
    final created = await api.create(input);
    state = AsyncValue.data([...?state.value, created]);
    return created;
  }

  Future<Deck> edit(String id, DeckUpdate input) async {
    final api = ref.read(decksApiProvider);
    final updated = await api.update(id, input);
    final current = state.value ?? const [];
    state = AsyncValue.data([
      for (final d in current) d.id == id ? updated : d,
    ]);
    return updated;
  }

  Future<void> delete(String id) async {
    await ref.read(decksApiProvider).delete(id);
    final current = state.value ?? const [];
    state = AsyncValue.data([
      for (final d in current)
        if (d.id != id) d,
    ]);
  }
}

final decksControllerProvider =
    AsyncNotifierProvider<DecksController, List<Deck>>(DecksController.new);

/// Single deck — re-fetched lazily so we always see fresh card data.
final deckByIdProvider =
    FutureProvider.family<Deck, String>((ref, id) async {
  return ref.read(decksApiProvider).get(id);
});
