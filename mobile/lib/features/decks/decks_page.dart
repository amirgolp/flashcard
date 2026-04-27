import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_router.dart';
import '../../shared/widgets/error_view.dart';
import 'decks_controller.dart';

class DecksPage extends ConsumerWidget {
  const DecksPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(decksControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Decks')),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add),
        label: const Text('New deck'),
        onPressed: () => context.push('${AppRoutes.decks}/new'),
      ),
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(decksControllerProvider.notifier).refresh(),
        child: state.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ErrorView(
            error: e,
            onRetry: () =>
                ref.read(decksControllerProvider.notifier).refresh(),
          ),
          data: (decks) {
            if (decks.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.2),
                  EmptyView(
                    icon: Icons.style_outlined,
                    title: 'No decks yet',
                    action: FilledButton.tonal(
                      onPressed: () => context.push('${AppRoutes.decks}/new'),
                      child: const Text('Create your first deck'),
                    ),
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
              itemCount: decks.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final deck = decks[i];
                return Card(
                  child: ListTile(
                    title: Text(deck.name),
                    subtitle: deck.description != null
                        ? Text(deck.description!)
                        : null,
                    trailing: Text('${deck.cards.length} cards'),
                    onTap: () =>
                        context.push('${AppRoutes.decks}/${deck.id}'),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
