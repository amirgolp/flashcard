import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_router.dart';
import '../../shared/widgets/error_view.dart';
import '../decks/decks_controller.dart';

/// "Review" tab — pick a deck to start a flip-card session against.
class ReviewPage extends ConsumerWidget {
  const ReviewPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final decksAsync = ref.watch(decksControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Review')),
      body: decksAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ErrorView(
          error: e,
          onRetry: () =>
              ref.read(decksControllerProvider.notifier).refresh(),
        ),
        data: (decks) {
          final reviewable =
              decks.where((d) => d.cards.isNotEmpty).toList(growable: false);
          if (reviewable.isEmpty) {
            return const EmptyView(
              icon: Icons.bolt_outlined,
              title: 'Add cards to a deck to start a review session.',
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: reviewable.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final deck = reviewable[i];
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.bolt),
                  title: Text(deck.name),
                  subtitle: Text('${deck.cards.length} cards ready'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context
                      .push('${AppRoutes.decks}/${deck.id}/review'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
