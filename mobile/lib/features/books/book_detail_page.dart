import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_exception.dart';
import '../../core/router/app_router.dart';
import '../../shared/widgets/error_view.dart';
import '../generation/range_generation_controller.dart';
import 'books_controller.dart';

class BookDetailPage extends ConsumerStatefulWidget {
  const BookDetailPage({required this.bookId, super.key});

  final String bookId;

  @override
  ConsumerState<BookDetailPage> createState() => _BookDetailPageState();
}

class _BookDetailPageState extends ConsumerState<BookDetailPage> {
  RangeValues? _range;
  int _numCards = 10;
  bool _generating = false;
  String? _error;
  String? _lastBatchId;

  @override
  Widget build(BuildContext context) {
    final bookAsync = ref.watch(bookByIdProvider(widget.bookId));
    return Scaffold(
      appBar: AppBar(
        title: bookAsync.maybeWhen(
          data: (b) => Text(b.title),
          orElse: () => const Text('Book'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Delete book',
            onPressed: () => _confirmDelete(context),
          ),
        ],
      ),
      body: bookAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ErrorView(
          error: e,
          onRetry: () => ref.invalidate(bookByIdProvider(widget.bookId)),
        ),
        data: (book) {
          final range = _range ?? RangeValues(1, book.totalPages.toDouble());
          final start = range.start.round();
          final end = range.end.round();
          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('${book.totalPages} pages',
                      style: Theme.of(context).textTheme.titleMedium),
                  if (book.targetLanguage != null ||
                      book.nativeLanguage != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      [
                        if (book.targetLanguage != null)
                          'target: ${book.targetLanguage}',
                        if (book.nativeLanguage != null)
                          'native: ${book.nativeLanguage}',
                      ].join(' · '),
                    ),
                  ],
                  const SizedBox(height: 24),
                  Text(
                    'Generate cards from pages $start – $end',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  RangeSlider(
                    values: range,
                    min: 1,
                    max: book.totalPages.toDouble(),
                    divisions: book.totalPages > 1 ? book.totalPages - 1 : 1,
                    labels: RangeLabels('$start', '$end'),
                    onChanged: _generating
                        ? null
                        : (values) => setState(() => _range = values),
                  ),
                  Row(
                    children: [
                      Expanded(child: Text('Cards to generate: $_numCards')),
                      Slider(
                        value: _numCards.toDouble(),
                        min: 5,
                        max: 30,
                        divisions: 5,
                        label: '$_numCards',
                        onChanged: _generating
                            ? null
                            : (v) => setState(() => _numCards = v.round()),
                      ),
                    ],
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 8),
                    Text(_error!,
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.error)),
                  ],
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: _generating
                        ? null
                        : () => _generate(book.id, start, end),
                    icon: const Icon(Icons.auto_awesome),
                    label: _generating
                        ? const Text('Generating…')
                        : const Text('Generate cards'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: _generating
                        ? null
                        : () => context.push(
                              '${AppRoutes.books}/${book.id}/capture'
                              '?page=$start',
                            ),
                    icon: const Icon(Icons.photo_camera_outlined),
                    label: const Text('Capture page from camera'),
                  ),
                  if (_lastBatchId != null) ...[
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: () => context.push(
                        '${AppRoutes.books}/${book.id}/drafts'
                        '?batch=$_lastBatchId',
                      ),
                      icon: const Icon(Icons.rate_review_outlined),
                      label: const Text('Review drafts'),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _generate(String bookId, int start, int end) async {
    setState(() {
      _generating = true;
      _error = null;
    });
    try {
      final result = await ref
          .read(rangeGenerationControllerProvider)
          .generate(
            bookId: bookId,
            startPage: start,
            endPage: end,
            numCards: _numCards,
          );
      setState(() => _lastBatchId = result.batchId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.message)),
        );
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } on Object catch (e) {
      // Local rendering / drift lookup can throw outside the API
      // surface — surface those too.
      setState(() => _error = 'Could not generate cards: $e');
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  Future<void> _confirmDelete(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete book?'),
        content:
            const Text('The PDF, progress, and any drafts will be removed.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton.tonal(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    await ref.read(booksControllerProvider.notifier).delete(widget.bookId);
    if (context.mounted) context.pop();
  }
}
