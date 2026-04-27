import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_router.dart';
import '../../shared/widgets/error_view.dart';
import '../../shared/widgets/hardness_badge.dart';
import 'decks_controller.dart';

class DeckDetailPage extends ConsumerWidget {
  const DeckDetailPage({required this.deckId, super.key});

  final String deckId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final deckAsync = ref.watch(deckByIdProvider(deckId));
    return Scaffold(
      appBar: AppBar(
        title: deckAsync.maybeWhen(
          data: (d) => Text(d.name),
          orElse: () => const Text('Deck'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Edit deck',
            onPressed: () => deckAsync.whenData(
              (deck) => context.push(
                '${AppRoutes.decks}/$deckId/edit',
                extra: {
                  'name': deck.name,
                  'description': deck.description,
                },
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Delete deck',
            onPressed: () => _confirmDelete(context, ref),
          ),
        ],
      ),
      floatingActionButton: deckAsync.maybeWhen(
        data: (deck) => deck.cards.isEmpty
            ? null
            : FloatingActionButton.extended(
                icon: const Icon(Icons.bolt),
                label: const Text('Review'),
                onPressed: () =>
                    context.push('${AppRoutes.decks}/$deckId/review'),
              ),
        orElse: () => null,
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(deckByIdProvider(deckId)),
        child: deckAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ErrorView(
            error: e,
            onRetry: () => ref.invalidate(deckByIdProvider(deckId)),
          ),
          data: (deck) {
            if (deck.cards.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.2),
                  const EmptyView(
                    icon: Icons.style_outlined,
                    title: 'This deck has no cards yet',
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
              itemCount: deck.cards.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final card = deck.cards[i];
                return Card(
                  child: ListTile(
                    title: Text(card.front),
                    subtitle: Text(
                      card.back,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    trailing: HardnessBadge(card.hardnessLevel),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete deck?'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton.tonal(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    await ref.read(decksControllerProvider.notifier).delete(deckId);
    if (context.mounted) context.pop();
  }
}
