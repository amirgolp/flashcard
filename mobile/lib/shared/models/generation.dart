import 'book.dart';
import 'draft_card.dart';
import 'json.dart';

class GenerateNextBatchRequest {
  const GenerateNextBatchRequest({
    required this.bookId,
    this.numPages = 5,
    this.numCards = 10,
    this.templateId,
  });

  final String bookId;
  final int numPages;
  final int numCards;
  final String? templateId;

  JsonMap toJson() => stripNulls({
        'book_id': bookId,
        'num_pages': numPages,
        'num_cards': numCards,
        'template_id': templateId,
      });
}

class GenerationResponse {
  const GenerationResponse({
    required this.batchId,
    required this.drafts,
    required this.pagesProcessed,
    required this.message,
  });

  final String batchId;
  final List<DraftCard> drafts;
  final PageRange pagesProcessed;
  final String message;

  factory GenerationResponse.fromJson(JsonMap json) => GenerationResponse(
        batchId: json.req<String>('batch_id'),
        drafts: (json.optList('drafts') ?? const [])
            .map(DraftCard.fromJson)
            .toList(growable: false),
        pagesProcessed: PageRange.fromJson(json.req<JsonMap>('pages_processed')),
        message: json.req<String>('message'),
      );
}

class BulkApproveRequest {
  const BulkApproveRequest({required this.draftIds, this.deckId});

  final List<String> draftIds;
  final String? deckId;

  JsonMap toJson() => stripNulls({
        'draft_ids': draftIds,
        'deck_id': deckId,
      });
}
