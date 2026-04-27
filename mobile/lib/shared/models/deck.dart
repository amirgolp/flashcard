import 'card.dart';
import 'json.dart';

class Deck {
  const Deck({
    required this.id,
    required this.name,
    required this.cards,
    this.description,
  });

  final String id;
  final String name;
  final String? description;
  final List<Card> cards;

  factory Deck.fromJson(JsonMap json) => Deck(
        id: json.req<String>('id'),
        name: json.req<String>('name'),
        description: json.opt<String>('description'),
        cards: (json.optList('cards') ?? const [])
            .map(Card.fromJson)
            .toList(growable: false),
      );
}

class DeckCreate {
  const DeckCreate({
    required this.name,
    this.description,
    this.cardIds = const [],
  });

  final String name;
  final String? description;
  final List<String> cardIds;

  JsonMap toJson() => stripNulls({
        'name': name,
        'description': description,
        'card_ids': cardIds,
      });
}

class DeckUpdate {
  const DeckUpdate({this.name, this.description, this.cardIds});

  final String? name;
  final String? description;
  final List<String>? cardIds;

  JsonMap toJson() => stripNulls({
        'name': name,
        'description': description,
        'card_ids': cardIds,
      });
}
