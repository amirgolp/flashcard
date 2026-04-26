import 'package:flashcard_mobile/main.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('FlashcardApp boots and shows the Decks page', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: FlashcardApp()));
    await tester.pumpAndSettle();

    expect(find.byType(MaterialApp), findsOneWidget);
    expect(find.text('Decks'), findsOneWidget);
  });
}
