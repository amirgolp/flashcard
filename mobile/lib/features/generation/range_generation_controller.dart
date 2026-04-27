import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/providers.dart';
import '../../core/db/card_cache_service.dart';
import '../../shared/models/image_generation.dart';
import 'pdf_page_renderer.dart';

/// Outcome of a successful range generation.
class RangeGenerationResult {
  const RangeGenerationResult({
    required this.batchId,
    required this.message,
    required this.pageCount,
  });

  final String batchId;
  final String message;
  final int pageCount;
}

/// Orchestrates: looking up the book's local PDF path in drift,
/// rendering the requested page range to base64 JPEGs, posting the
/// batch to `/generate/from-images`, and returning a small summary.
///
/// Lives behind a provider so tests can swap the renderer and API
/// without rebuilding the UI layer.
class RangeGenerationController {
  RangeGenerationController(this._ref);

  final Ref _ref;

  Future<RangeGenerationResult> generate({
    required String bookId,
    required int startPage,
    required int endPage,
    int numCards = 10,
    String? templateId,
  }) async {
    if (startPage < 1 || endPage < startPage) {
      throw ArgumentError(
        'invalid range: startPage=$startPage endPage=$endPage',
      );
    }

    final filePath = await _resolveLocalPath(bookId);
    if (filePath == null) {
      throw StateError(
        'No local PDF on file for book $bookId. Re-add the book to register '
        'its local copy.',
      );
    }

    final renderer = _ref.read(pdfPageRendererProvider);
    final images = await renderer.renderRange(
      filePath: filePath,
      startPage: startPage,
      endPage: endPage,
    );

    final api = _ref.read(generationApiProvider);
    final response = await api.fromImages(
      GenerateFromImagesRequest(
        bookId: bookId,
        images: images,
        numCards: numCards,
        templateId: templateId,
      ),
    );

    return RangeGenerationResult(
      batchId: response.batchId,
      message: response.message,
      pageCount: images.length,
    );
  }

  Future<String?> _resolveLocalPath(String bookId) async {
    final db = _ref.read(appDatabaseProvider);
    final row = await (db.select(db.books)..where((b) => b.id.equals(bookId)))
        .getSingleOrNull();
    return row?.filePath;
  }
}

final rangeGenerationControllerProvider = Provider<RangeGenerationController>(
  RangeGenerationController.new,
);
