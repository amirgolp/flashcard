import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/providers.dart';
import '../../shared/models/draft_card.dart';
import '../../shared/widgets/error_view.dart';

final _draftsProvider = FutureProvider.autoDispose
    .family<List<DraftCard>, _DraftsQuery>((ref, query) async {
  return ref.read(generationApiProvider).listDrafts(
        bookId: query.bookId,
        batchId: query.batchId,
        status: 'pending',
      );
});

class _DraftsQuery {
  const _DraftsQuery({required this.bookId, this.batchId});
  final String bookId;
  final String? batchId;

  @override
  bool operator ==(Object other) =>
      other is _DraftsQuery &&
      other.bookId == bookId &&
      other.batchId == batchId;

  @override
  int get hashCode => Object.hash(bookId, batchId);
}

class DraftsReviewPage extends ConsumerWidget {
  const DraftsReviewPage({required this.bookId, this.batchId, super.key});

  final String bookId;
  final String? batchId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = _DraftsQuery(bookId: bookId, batchId: batchId);
    final draftsAsync = ref.watch(_draftsProvider(query));
    return Scaffold(
      appBar: AppBar(
        title: Text(batchId == null ? 'All drafts' : 'Drafts in this batch'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_draftsProvider(query)),
        child: draftsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ErrorView(
            error: e,
            onRetry: () => ref.invalidate(_draftsProvider(query)),
          ),
          data: (drafts) {
            if (drafts.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 80),
                  EmptyView(
                    icon: Icons.rate_review_outlined,
                    title: 'No pending drafts.',
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
              itemCount: drafts.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) =>
                  _DraftTile(draft: drafts[i], query: query),
            );
          },
        ),
      ),
    );
  }
}

class _DraftTile extends ConsumerStatefulWidget {
  const _DraftTile({required this.draft, required this.query});

  final DraftCard draft;
  final _DraftsQuery query;

  @override
  ConsumerState<_DraftTile> createState() => _DraftTileState();
}

class _DraftTileState extends ConsumerState<_DraftTile> {
  bool _busy = false;

  Future<void> _approve() async {
    setState(() => _busy = true);
    try {
      await ref.read(generationApiProvider).approveDraft(widget.draft.id);
      ref.invalidate(_draftsProvider(widget.query));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _reject() async {
    setState(() => _busy = true);
    try {
      await ref.read(generationApiProvider).rejectDraft(widget.draft.id);
      ref.invalidate(_draftsProvider(widget.query));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final draft = widget.draft;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(draft.front,
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(draft.back),
            if (draft.examples != null && draft.examples!.isNotEmpty) ...[
              const SizedBox(height: 8),
              ...draft.examples!.map(
                (e) => Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    '· ${e.sentence} — ${e.translation}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: _busy ? null : _reject,
                  icon: const Icon(Icons.close),
                  label: const Text('Reject'),
                ),
                const SizedBox(width: 8),
                FilledButton.icon(
                  onPressed: _busy ? null : _approve,
                  icon: const Icon(Icons.check),
                  label: const Text('Approve'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
