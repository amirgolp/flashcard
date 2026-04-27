import 'package:flutter/material.dart';

import '../models/card.dart';

class HardnessBadge extends StatelessWidget {
  const HardnessBadge(this.level, {super.key});

  final HardnessLevel level;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final (label, bg, fg) = switch (level) {
      HardnessLevel.easy => (
          'Easy',
          scheme.tertiaryContainer,
          scheme.onTertiaryContainer
        ),
      HardnessLevel.medium => (
          'Medium',
          scheme.secondaryContainer,
          scheme.onSecondaryContainer
        ),
      HardnessLevel.hard => (
          'Hard',
          scheme.errorContainer,
          scheme.onErrorContainer
        ),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context)
            .textTheme
            .labelSmall
            ?.copyWith(color: fg, fontWeight: FontWeight.w600),
      ),
    );
  }
}
