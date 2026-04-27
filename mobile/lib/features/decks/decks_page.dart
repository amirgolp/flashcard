import 'package:flutter/material.dart';

class DecksPage extends StatelessWidget {
  const DecksPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Decks')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Decks list — coming in slice 4',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
