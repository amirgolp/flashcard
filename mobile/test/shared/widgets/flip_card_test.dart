import 'package:flashcard_mobile/shared/widgets/flip_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('tap toggles between front and back', (tester) async {
    final key = GlobalKey<FlipCardState>();
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: Center(
          child: SizedBox(
            width: 200,
            height: 200,
            child: FlipCard(
              key: key,
              front: const Text('FRONT'),
              back: const Text('BACK'),
            ),
          ),
        ),
      ),
    ));

    expect(find.text('FRONT'), findsOneWidget);
    expect(find.text('BACK'), findsNothing);

    await tester.tap(find.byType(FlipCard));
    await tester.pumpAndSettle();

    expect(find.text('BACK'), findsOneWidget);
    expect(find.text('FRONT'), findsNothing);

    key.currentState!.toggle();
    await tester.pumpAndSettle();
    expect(find.text('FRONT'), findsOneWidget);
  });
}
