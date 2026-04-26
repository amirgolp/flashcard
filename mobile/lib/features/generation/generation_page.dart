import 'package:flutter/material.dart';

// Send selected text/image → POST /generation/from-content → review drafts.
class GenerationPage extends StatelessWidget {
  const GenerationPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Generate')),
      body: const Center(child: Text('Card generation — TODO')),
    );
  }
}
