import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/providers.dart';
import '../../shared/models/card.dart';

class CardsController extends AsyncNotifier<List<Card>> {
  @override
  Future<List<Card>> build() async => ref.read(cardsApiProvider).list();

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => ref.read(cardsApiProvider).list());
  }

  Future<Card> create(CardCreate input) async {
    final created = await ref.read(cardsApiProvider).create(input);
    state = AsyncValue.data([...?state.value, created]);
    return created;
  }

  Future<Card> edit(String id, CardUpdate input) async {
    final updated = await ref.read(cardsApiProvider).update(id, input);
    final current = state.value ?? const [];
    state = AsyncValue.data([
      for (final c in current) c.id == id ? updated : c,
    ]);
    return updated;
  }

  Future<void> delete(String id) async {
    await ref.read(cardsApiProvider).delete(id);
    final current = state.value ?? const [];
    state = AsyncValue.data([
      for (final c in current)
        if (c.id != id) c,
    ]);
  }
}

final cardsControllerProvider =
    AsyncNotifierProvider<CardsController, List<Card>>(CardsController.new);
