import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_router.dart';
import '../../shared/widgets/error_view.dart';
import 'books_controller.dart';

class BooksPage extends ConsumerWidget {
  const BooksPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(booksControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Books')),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.upload_file),
        label: const Text('Upload'),
        onPressed: () => context.push('${AppRoutes.books}/upload'),
      ),
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(booksControllerProvider.notifier).refresh(),
        child: state.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ErrorView(
            error: e,
            onRetry: () =>
                ref.read(booksControllerProvider.notifier).refresh(),
          ),
          data: (books) {
            if (books.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.2),
                  EmptyView(
                    icon: Icons.menu_book_outlined,
                    title:
                        'Upload a PDF to start generating cards from it.',
                    action: FilledButton.tonal(
                      onPressed: () =>
                          context.push('${AppRoutes.books}/upload'),
                      child: const Text('Upload PDF'),
                    ),
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
              itemCount: books.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final book = books[i];
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.menu_book),
                    title: Text(book.title),
                    subtitle: Text(
                      [
                        '${book.totalPages} pages',
                        if (book.targetLanguage != null) book.targetLanguage!,
                      ].join(' · '),
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () =>
                        context.push('${AppRoutes.books}/${book.id}'),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
