import 'package:flutter/material.dart';
import 'package:flutter_card_swiper/flutter_card_swiper.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/providers.dart';
import '../../shared/models/card.dart' as model;
import '../../shared/widgets/error_view.dart';
import '../../shared/widgets/flip_card.dart';
import '../../shared/widgets/hardness_badge.dart';
import '../decks/decks_controller.dart';

class ReviewSessionPage extends ConsumerStatefulWidget {
  const ReviewSessionPage({required this.deckId, super.key});

  final String deckId;

  @override
  ConsumerState<ReviewSessionPage> createState() => _ReviewSessionPageState();
}

class _ReviewSessionPageState extends ConsumerState<ReviewSessionPage> {
  final CardSwiperController _swiper = CardSwiperController();
  int _index = 0;
  int _easyCount = 0;
  int _mediumCount = 0;
  int _hardCount = 0;

  @override
  void dispose() {
    _swiper.dispose();
    super.dispose();
  }

  Future<void> _markAndAdvance(model.Card card, model.HardnessLevel level) async {
    setState(() {
      switch (level) {
        case model.HardnessLevel.easy:
          _easyCount += 1;
        case model.HardnessLevel.medium:
          _mediumCount += 1;
        case model.HardnessLevel.hard:
          _hardCount += 1;
      }
    });

    if (card.hardnessLevel != level) {
      // Fire-and-forget update — UI stays responsive even if the
      // request takes a moment. Errors surface as a transient snackbar.
      try {
        await ref.read(cardsApiProvider).update(
              card.id,
              model.CardUpdate(hardnessLevel: level),
            );
      } on Object catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to save hardness: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final deckAsync = ref.watch(deckByIdProvider(widget.deckId));
    return Scaffold(
      appBar: AppBar(title: const Text('Review')),
      body: deckAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ErrorView(
          error: e,
          onRetry: () => ref.invalidate(deckByIdProvider(widget.deckId)),
        ),
        data: (deck) {
          if (deck.cards.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'This deck has no cards to review.',
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          if (_index >= deck.cards.length) {
            return _SessionSummary(
              total: deck.cards.length,
              easy: _easyCount,
              medium: _mediumCount,
              hard: _hardCount,
            );
          }
          return _ReviewBody(
            deckCards: deck.cards,
            swiperController: _swiper,
            onSwipe: (previous, _, direction) {
              final card = deck.cards[previous];
              final level = switch (direction) {
                CardSwiperDirection.right => model.HardnessLevel.easy,
                CardSwiperDirection.top => model.HardnessLevel.medium,
                CardSwiperDirection.left => model.HardnessLevel.hard,
                _ => null,
              };
              if (level == null) return false;
              _markAndAdvance(card, level);
              setState(() => _index = previous + 1);
              return true;
            },
          );
        },
      ),
    );
  }
}

class _ReviewBody extends StatelessWidget {
  const _ReviewBody({
    required this.deckCards,
    required this.swiperController,
    required this.onSwipe,
  });

  final List<model.Card> deckCards;
  final CardSwiperController swiperController;
  final bool Function(int previous, int? next, CardSwiperDirection direction)
      onSwipe;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      child: Column(
        children: [
          Expanded(
            child: CardSwiper(
              controller: swiperController,
              cardsCount: deckCards.length,
              numberOfCardsDisplayed:
                  deckCards.length >= 3 ? 3 : deckCards.length,
              backCardOffset: const Offset(0, 30),
              padding: const EdgeInsets.all(8),
              allowedSwipeDirection: const AllowedSwipeDirection.only(
                left: true,
                right: true,
                up: true,
              ),
              onSwipe: onSwipe,
              cardBuilder: (_, index, ___, ____) =>
                  _CardFace(card: deckCards[index]),
            ),
          ),
          const SizedBox(height: 16),
          const _SwipeLegend(),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              FilledButton.tonalIcon(
                onPressed: () =>
                    swiperController.swipe(CardSwiperDirection.left),
                icon: const Icon(Icons.thumb_down_alt_outlined),
                label: const Text('Hard'),
              ),
              FilledButton.tonalIcon(
                onPressed: () =>
                    swiperController.swipe(CardSwiperDirection.top),
                icon: const Icon(Icons.swap_horiz),
                label: const Text('Medium'),
              ),
              FilledButton.tonalIcon(
                onPressed: () =>
                    swiperController.swipe(CardSwiperDirection.right),
                icon: const Icon(Icons.thumb_up_alt_outlined),
                label: const Text('Easy'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CardFace extends StatelessWidget {
  const _CardFace({required this.card});

  final model.Card card;

  @override
  Widget build(BuildContext context) {
    return FlipCard(
      front: _CardSurface(
        title: card.front,
        accent: HardnessBadge(card.hardnessLevel),
      ),
      back: _CardSurface(
        title: card.back,
        subtitle: card.examples
            ?.map((e) => '${e.sentence} — ${e.translation}')
            .join('\n'),
      ),
    );
  }
}

class _CardSurface extends StatelessWidget {
  const _CardSurface({required this.title, this.subtitle, this.accent});

  final String title;
  final String? subtitle;
  final Widget? accent;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          if (accent != null) ...[
            Row(children: [accent!, const Spacer()]),
            const SizedBox(height: 16),
          ],
          Expanded(
            child: Center(
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.headlineMedium,
                      textAlign: TextAlign.center,
                    ),
                    if (subtitle != null && subtitle!.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Text(
                        subtitle!,
                        style: Theme.of(context).textTheme.bodyMedium,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
          Text(
            'Tap to flip',
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: scheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _SwipeLegend extends StatelessWidget {
  const _SwipeLegend();

  @override
  Widget build(BuildContext context) {
    final style = Theme.of(context).textTheme.bodySmall;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text('← hard   ', style: style),
        Text('↑ medium   ', style: style),
        Text('easy →', style: style),
      ],
    );
  }
}

class _SessionSummary extends StatelessWidget {
  const _SessionSummary({
    required this.total,
    required this.easy,
    required this.medium,
    required this.hard,
  });

  final int total;
  final int easy;
  final int medium;
  final int hard;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.celebration_outlined,
                size: 64, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 16),
            Text(
              'Session complete',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text('$total cards reviewed'),
            const SizedBox(height: 24),
            _SummaryRow(label: 'Easy', value: easy),
            _SummaryRow(label: 'Medium', value: medium),
            _SummaryRow(label: 'Hard', value: hard),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => GoRouter.of(context).pop(),
              child: const Text('Done'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(width: 80, child: Text(label)),
          Text(value.toString(),
              style: Theme.of(context).textTheme.titleMedium),
        ],
      ),
    );
  }
}
