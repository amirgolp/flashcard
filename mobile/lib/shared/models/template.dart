import 'json.dart';

class TemplateField {
  const TemplateField({
    required this.name,
    required this.label,
    required this.description,
    this.type = 'text',
    this.showOnFront = false,
    this.required = true,
  });

  final String name;
  final String label;
  final String description;
  final String type;
  final bool showOnFront;
  final bool required;

  factory TemplateField.fromJson(JsonMap json) => TemplateField(
        name: json.req<String>('name'),
        label: json.req<String>('label'),
        description: json.req<String>('description'),
        type: json.opt<String>('type') ?? 'text',
        showOnFront: json.opt<bool>('show_on_front') ?? false,
        required: json.opt<bool>('required') ?? true,
      );

  JsonMap toJson() => {
        'name': name,
        'label': label,
        'description': description,
        'type': type,
        'show_on_front': showOnFront,
        'required': required,
      };
}

class CardTemplate {
  const CardTemplate({
    required this.id,
    required this.name,
    required this.fields,
    required this.dateCreated,
    required this.lastEdited,
    this.description,
    this.systemPrompt,
    this.isDefault = false,
    this.ownerId,
  });

  final String id;
  final String name;
  final String? description;
  final List<TemplateField> fields;
  final String? systemPrompt;
  final bool isDefault;
  final String? ownerId;
  final DateTime dateCreated;
  final DateTime lastEdited;

  factory CardTemplate.fromJson(JsonMap json) => CardTemplate(
        id: json.req<String>('id'),
        name: json.req<String>('name'),
        description: json.opt<String>('description'),
        fields: (json.optList('fields') ?? const [])
            .map(TemplateField.fromJson)
            .toList(growable: false),
        systemPrompt: json.opt<String>('system_prompt'),
        isDefault: json.opt<bool>('is_default') ?? false,
        ownerId: json.opt<String>('owner') ?? json.opt<String>('owner_id'),
        dateCreated: json.reqDate('date_created'),
        lastEdited: json.reqDate('last_edited'),
      );
}

class TemplateCreate {
  const TemplateCreate({
    required this.name,
    required this.fields,
    this.description,
    this.systemPrompt,
    this.isDefault = false,
  });

  final String name;
  final String? description;
  final List<TemplateField> fields;
  final String? systemPrompt;
  final bool isDefault;

  JsonMap toJson() => stripNulls({
        'name': name,
        'description': description,
        'fields': fields.map((f) => f.toJson()).toList(),
        'system_prompt': systemPrompt,
        'is_default': isDefault,
      });
}

class TemplateUpdate {
  const TemplateUpdate({
    this.name,
    this.description,
    this.fields,
    this.systemPrompt,
    this.isDefault,
  });

  final String? name;
  final String? description;
  final List<TemplateField>? fields;
  final String? systemPrompt;
  final bool? isDefault;

  JsonMap toJson() => stripNulls({
        'name': name,
        'description': description,
        'fields': fields?.map((f) => f.toJson()).toList(),
        'system_prompt': systemPrompt,
        'is_default': isDefault,
      });
}
