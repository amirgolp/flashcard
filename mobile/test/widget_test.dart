import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('placeholder smoke test', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: Text('hello'))),
    );
    expect(find.text('hello'), findsOneWidget);
  });
}
