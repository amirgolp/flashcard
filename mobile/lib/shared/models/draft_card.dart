import 'card.dart';
import 'json.dart';

enum DraftCardStatus {
  pending('pending'),
  approved('approved'),
  rejected('rejected');

  const DraftCardStatus(this.wire);

  final String wire;

  static DraftCardStatus fromWire(String value) =>
      DraftCardStatus.values.firstWhere((e) => e.wire == value);
}

class DraftCard {
  const DraftCard({
    required this.id,
    required this.front,
    required this.back,
    required this.status,
    required this.bookId,
    required this.dateCreated,
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
    this.sourcePageStart,
    this.sourcePageEnd,
    this.generationBatchId,
  });

  final String id;
  final String front;
  final String back;
  final DraftCardStatus status;
  final String bookId;
  final DateTime dateCreated;
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
  final int? sourcePageStart;
  final int? sourcePageEnd;
  final String? generationBatchId;

  factory DraftCard.fromJson(JsonMap json) => DraftCard(
        id: json.req<String>('id'),
        front: json.req<String>('front'),
        back: json.req<String>('back'),
        status: DraftCardStatus.fromWire(json.req<String>('status')),
        bookId: json.req<String>('book_id'),
        dateCreated: json.reqDate('date_created'),
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
        sourcePageStart: json.opt<int>('source_page_start'),
        sourcePageEnd: json.opt<int>('source_page_end'),
        generationBatchId: json.opt<String>('generation_batch_id'),
      );
}

class DraftCardUpdate {
  const DraftCardUpdate({
    this.front,
    this.back,
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
