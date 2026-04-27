import 'package:flashcard_mobile/main.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('FlashcardApp boots into the login flow when unauthenticated',
      (tester) async {
    await tester.pumpWidget(const ProviderScope(child: FlashcardApp()));
    // Splash -> auth restore -> redirect to /login.
    await tester.pumpAndSettle();

    expect(find.byType(MaterialApp), findsOneWidget);
    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'Log in'), findsOneWidget);
  });
}
