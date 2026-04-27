import 'json.dart';

/// Payload for `POST /generate/from-image`. Used by the camera flow:
/// one photo at a time, base64-encoded so the request stays JSON.
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

/// One PDF page rendered to a base64-encoded JPEG. Multiple parts
/// batch into a single [GenerateFromImagesRequest] so the device-only
/// page-range flow renders locally and posts the whole batch.
class ImagePart {
  const ImagePart({
    required this.imageBase64,
    this.mimeType = 'image/jpeg',
    this.sourcePage,
  });

  final String imageBase64;
  final String mimeType;
  final int? sourcePage;

  JsonMap toJson() => stripNulls({
        'image_base64': imageBase64,
        'mime_type': mimeType,
        'source_page': sourcePage,
      });
}

/// Payload for `POST /generate/from-images`. Pairs with the device-
/// only book flow: the client renders the selected page range to
/// JPEGs locally and the server forwards the whole batch to Gemini in
/// one call.
class GenerateFromImagesRequest {
  const GenerateFromImagesRequest({
    required this.bookId,
    required this.images,
    this.numCards = 10,
    this.templateId,
  });

  final String bookId;
  final List<ImagePart> images;
  final int numCards;
  final String? templateId;

  JsonMap toJson() => stripNulls({
        'book_id': bookId,
        'images': images.map((p) => p.toJson()).toList(),
        'num_cards': numCards,
        'template_id': templateId,
      });
}
