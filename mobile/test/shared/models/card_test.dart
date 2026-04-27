import 'package:flashcard_mobile/shared/models/card.dart';
import 'package:flashcard_mobile/shared/models/json.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Card.fromJson', () {
    test('parses every field', () {
      final json = <String, Object?>{
        'id': 'c1',
        'front': 'der Hund',
        'back': 'the dog',
        'hardness_level': 'hard',
        'date_created': '2026-04-01T12:00:00Z',
        'last_edited': '2026-04-02T12:00:00Z',
        'last_visited': '2026-04-03T12:00:00Z',
        'examples': <Object?>[
          <String, Object?>{'sentence': 'Der Hund bellt.', 'translation': 'The dog barks.'},
        ],
        'synonyms': <Object?>['Köter'],
        'tags': <Object?>['tier'],
        'part_of_speech': 'noun',
        'gender': 'masculine',
        'plural_form': 'die Hunde',
        'source_book_id': 'b1',
        'source_page': 42,
      };
      final card = Card.fromJson(json);
      expect(card.id, 'c1');
      expect(card.front, 'der Hund');
      expect(card.hardnessLevel, HardnessLevel.hard);
      expect(card.examples, hasLength(1));
      expect(card.examples!.single.sentence, 'Der Hund bellt.');
      expect(card.synonyms, ['Köter']);
      expect(card.sourcePage, 42);
    });

    test('tolerates missing optional fields', () {
      final json = <String, Object?>{
        'id': 'c1',
        'front': 'a',
        'back': 'b',
        'hardness_level': 'medium',
        'date_created': '2026-04-01T12:00:00Z',
        'last_edited': '2026-04-01T12:00:00Z',
      };
      final card = Card.fromJson(json);
      expect(card.examples, isNull);
      expect(card.tags, isNull);
      expect(card.lastVisited, isNull);
    });

    test('throws FormatException on missing required field', () {
      final json = <String, Object?>{
        'id': 'c1',
        // front missing
        'back': 'b',
        'hardness_level': 'medium',
        'date_created': '2026-04-01T12:00:00Z',
        'last_edited': '2026-04-01T12:00:00Z',
      };
      expect(() => Card.fromJson(json), throwsA(isA<FormatException>()));
    });
  });

  group('CardCreate.toJson', () {
    test('omits null optional fields', () {
      final body = const CardCreate(front: 'q', back: 'a').toJson();
      expect(body.containsKey('synonyms'), isFalse);
      expect(body['front'], 'q');
      expect(body['hardness_level'], 'medium');
    });
  });

  test('JsonMapX.req throws when type mismatches', () {
    final json = <String, Object?>{'id': 42};
    expect(() => json.req<String>('id'), throwsA(isA<FormatException>()));
  });
}
