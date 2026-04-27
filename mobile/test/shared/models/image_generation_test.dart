import 'package:flashcard_mobile/shared/models/image_generation.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('GenerateFromImageRequest.toJson includes required fields', () {
    final body = const GenerateFromImageRequest(
      imageBase64: 'AAA=',
      bookId: 'b1',
      numCards: 12,
      sourcePage: 7,
    ).toJson();
    expect(body['image_base64'], 'AAA=');
    expect(body['mime_type'], 'image/jpeg');
    expect(body['book_id'], 'b1');
    expect(body['num_cards'], 12);
    expect(body['source_page'], 7);
  });

  test('omits null optional fields', () {
    final body = const GenerateFromImageRequest(imageBase64: 'AAA=').toJson();
    expect(body.containsKey('book_id'), isFalse);
    expect(body.containsKey('source_page'), isFalse);
    expect(body.containsKey('template_id'), isFalse);
  });
}
