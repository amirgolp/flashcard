import 'json.dart';

enum HardnessLevel {
  easy('easy'),
  medium('medium'),
  hard('hard');

  const HardnessLevel(this.wire);

  final String wire;

  static HardnessLevel fromWire(String value) =>
      HardnessLevel.values.firstWhere((e) => e.wire == value);
}

class ExampleSentence {
  const ExampleSentence({required this.sentence, required this.translation});

  final String sentence;
  final String translation;

  factory ExampleSentence.fromJson(JsonMap json) => ExampleSentence(
        sentence: json.req<String>('sentence'),
        translation: json.req<String>('translation'),
      );

  JsonMap toJson() =>
      {'sentence': sentence, 'translation': translation};
}

class Card {
  const Card({
    required this.id,
    required this.front,
    required this.back,
    required this.hardnessLevel,
    required this.dateCreated,
    required this.lastEdited,
    this.lastVisited,
    this.exampleOriginal,
    this.exampleTranslation,
    this.examples,
    this.synonyms,
    this.antonyms,
    this.partOfSpeech,
    this.gender,
    this.pluralForm,
    this.pronunciation,
    this.notes,
    this.tags,
    this.templateId,
    this.customFields,
    this.sourceBookId,
    this.sourcePage,
  });

  final String id;
  final String front;
  final String back;
  final HardnessLevel hardnessLevel;
  final DateTime dateCreated;
  final DateTime lastEdited;
  final DateTime? lastVisited;
  final String? exampleOriginal;
  final String? exampleTranslation;
  final List<ExampleSentence>? examples;
  final List<String>? synonyms;
  final List<String>? antonyms;
  final String? partOfSpeech;
  final String? gender;
  final String? pluralForm;
  final String? pronunciation;
  final String? notes;
  final List<String>? tags;
  final String? templateId;
  final JsonMap? customFields;
  final String? sourceBookId;
  final int? sourcePage;

  factory Card.fromJson(JsonMap json) => Card(
        id: json.req<String>('id'),
        front: json.req<String>('front'),
        back: json.req<String>('back'),
        hardnessLevel:
            HardnessLevel.fromWire(json.req<String>('hardness_level')),
        dateCreated: json.reqDate('date_created'),
        lastEdited: json.reqDate('last_edited'),
        lastVisited: json.optDate('last_visited'),
        exampleOriginal: json.opt<String>('example_original'),
        exampleTranslation: json.opt<String>('example_translation'),
        examples: json
            .optList('examples')
            ?.map(ExampleSentence.fromJson)
            .toList(growable: false),
        synonyms: json.optStringList('synonyms'),
        antonyms: json.optStringList('antonyms'),
        partOfSpeech: json.opt<String>('part_of_speech'),
        gender: json.opt<String>('gender'),
        pluralForm: json.opt<String>('plural_form'),
        pronunciation: json.opt<String>('pronunciation'),
        notes: json.opt<String>('notes'),
        tags: json.optStringList('tags'),
        templateId: json.opt<String>('template_id'),
        customFields: json.opt<JsonMap>('custom_fields'),
        sourceBookId: json.opt<String>('source_book_id'),
        sourcePage: json.opt<int>('source_page'),
      );

  Card copyWith({HardnessLevel? hardnessLevel, DateTime? lastVisited}) => Card(
        id: id,
        front: front,
        back: back,
        hardnessLevel: hardnessLevel ?? this.hardnessLevel,
        dateCreated: dateCreated,
        lastEdited: lastEdited,
        lastVisited: lastVisited ?? this.lastVisited,
        exampleOriginal: exampleOriginal,
        exampleTranslation: exampleTranslation,
        examples: examples,
        synonyms: synonyms,
        antonyms: antonyms,
        partOfSpeech: partOfSpeech,
        gender: gender,
        pluralForm: pluralForm,
        pronunciation: pronunciation,
        notes: notes,
        tags: tags,
        templateId: templateId,
        customFields: customFields,
        sourceBookId: sourceBookId,
        sourcePage: sourcePage,
      );
}

class CardCreate {
  const CardCreate({
    required this.front,
    required this.back,
    this.hardnessLevel = HardnessLevel.medium,
    this.exampleOriginal,
    this.exampleTranslation,
    this.examples,
    this.synonyms,
    this.antonyms,
    this.partOfSpeech,
    this.gender,
    this.pluralForm,
    this.pronunciation,
    this.notes,
    this.tags,
    this.templateId,
    this.customFields,
  });

  final String front;
  final String back;
  final HardnessLevel hardnessLevel;
  final String? exampleOriginal;
  final String? exampleTranslation;
  final List<ExampleSentence>? examples;
  final List<String>? synonyms;
  final List<String>? antonyms;
  final String? partOfSpeech;
  final String? gender;
  final String? pluralForm;
  final String? pronunciation;
  final String? notes;
  final List<String>? tags;
  final String? templateId;
  final JsonMap? customFields;

  JsonMap toJson() => stripNulls({
        'front': front,
        'back': back,
        'hardness_level': hardnessLevel.wire,
        'example_original': exampleOriginal,
        'example_translation': exampleTranslation,
        'examples': examples?.map((e) => e.toJson()).toList(),
        'synonyms': synonyms,
        'antonyms': antonyms,
        'part_of_speech': partOfSpeech,
        'gender': gender,
        'plural_form': pluralForm,
        'pronunciation': pronunciation,
        'notes': notes,
        'tags': tags,
        'template_id': templateId,
        'custom_fields': customFields,
      });
}

class CardUpdate {
  const CardUpdate({
    this.front,
    this.back,
    this.hardnessLevel,
    this.exampleOriginal,
    this.exampleTranslation,
    this.examples,
    this.synonyms,
    this.antonyms,
    this.partOfSpeech,
    this.gender,
    this.pluralForm,
    this.pronunciation,
    this.notes,
    this.tags,
    this.templateId,
    this.customFields,
  });

  final String? front;
  final String? back;
  final HardnessLevel? hardnessLevel;
  final String? exampleOriginal;
  final String? exampleTranslation;
  final List<ExampleSentence>? examples;
  final List<String>? synonyms;
  final List<String>? antonyms;
  final String? partOfSpeech;
  final String? gender;
  final String? pluralForm;
  final String? pronunciation;
  final String? notes;
  final List<String>? tags;
  final String? templateId;
  final JsonMap? customFields;

  JsonMap toJson() => stripNulls({
        'front': front,
        'back': back,
        'hardness_level': hardnessLevel?.wire,
        'example_original': exampleOriginal,
        'example_translation': exampleTranslation,
        'examples': examples?.map((e) => e.toJson()).toList(),
        'synonyms': synonyms,
        'antonyms': antonyms,
        'part_of_speech': partOfSpeech,
        'gender': gender,
        'plural_form': pluralForm,
        'pronunciation': pronunciation,
        'notes': notes,
        'tags': tags,
        'template_id': templateId,
        'custom_fields': customFields,
      });
}
