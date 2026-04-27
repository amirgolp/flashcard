import 'json.dart';

/// Payload for `POST /generate/from-image` (planned backend endpoint).
/// The client-side flow is wired against this contract so the mobile
/// app can ship before the endpoint lands; until then requests will
/// 404 and the UI surfaces the error normally.
class GenerateFromImageRequest {
  const GenerateFromImageRequest({
    required this.imageBase64,
    this.mimeType = 'image/jpeg',
    this.bookId,
    this.templateId,
    this.numCards = 10,
    this.sourcePage,
  });

  final String imageBase64;
  final String mimeType;
  final String? bookId;
  final String? templateId;
  final int numCards;
  final int? sourcePage;

  JsonMap toJson() => stripNulls({
        'image_base64': imageBase64,
        'mime_type': mimeType,
        'book_id': bookId,
        'template_id': templateId,
        'num_cards': numCards,
        'source_page': sourcePage,
      });
}
