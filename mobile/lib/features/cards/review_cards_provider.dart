import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/db/card_cache_service.dart';
import '../../shared/models/card.dart' as model;
import '../decks/decks_controller.dart';

/// Resolves the card list for a deck. Tries the network first; on
/// failure falls back to whatever the offline cache holds. Either way
/// it asks the cache to drain pending hardness updates so any past
/// offline edits sync now.
///
/// Public so the offline-fallback contract is unit-testable; the
/// review screen watches it directly.
final reviewCardsProvider = FutureProvider.autoDispose
    .family<List<model.Card>, String>((ref, deckId) async {
  final cache = ref.read(cardCacheServiceProvider);
  await cache.drainPending();
  try {
    final deck = await ref.read(deckByIdProvider(deckId).future);
    return deck.cards;
  } on Object {
    return cache.cachedForDeck(deckId);
  }
});
