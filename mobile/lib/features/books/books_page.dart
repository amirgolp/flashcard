import 'package:flutter/material.dart';

// PDF import + local file index — TODO: file_picker + pdfx + drift Books table.
class BooksPage extends StatelessWidget {
  const BooksPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Books')),
      body: const Center(child: Text('Books library — TODO')),
    );
  }
}
