import 'package:flashcard_mobile/core/api/providers.dart';
import 'package:flashcard_mobile/core/api/token_store.dart';
import 'package:flashcard_mobile/main.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('FlashcardApp boots into the login flow when unauthenticated',
      (tester) async {
    // Real SecureTokenStore needs platform channels that aren't wired in
    // unit tests; swap in the in-memory store so restore() resolves.
    await tester.pumpWidget(ProviderScope(
      overrides: [
        tokenStoreProvider.overrideWith((_) => InMemoryTokenStore()),
      ],
      child: const FlashcardApp(),
    ));
    await tester.pumpAndSettle();

    expect(find.byType(MaterialApp), findsOneWidget);
    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.widgetWithText(OutlinedButton, 'Log in with username'),
        findsOneWidget);
  });
}
