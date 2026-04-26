import 'package:flutter/material.dart';

// Swipeable flip-card review UI — TODO: wire flutter_card_swiper + flip animation.
class CardsPage extends StatelessWidget {
  const CardsPage({super.key, required this.deckId});

  final String deckId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Review · $deckId')),
      body: const Center(child: Text('Card review — TODO')),
    );
  }
}
