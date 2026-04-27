import 'package:flashcard_mobile/shared/models/deck.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Deck.fromJson handles empty cards list', () {
    final deck = Deck.fromJson(<String, Object?>{
      'id': 'd1',
      'name': 'Spanish basics',
      'cards': const <Object?>[],
    });
    expect(deck.id, 'd1');
    expect(deck.cards, isEmpty);
  });

  test('DeckCreate.toJson keeps explicit empty card_ids list', () {
    final body = const DeckCreate(name: 'd', cardIds: []).toJson();
    expect(body['name'], 'd');
    expect(body['card_ids'], <String>[]);
  });

  test('DeckUpdate.toJson omits null fields', () {
    final body = const DeckUpdate(name: 'renamed').toJson();
    expect(body, {'name': 'renamed'});
  });
}
