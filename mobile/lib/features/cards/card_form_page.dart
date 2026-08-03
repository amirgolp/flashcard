import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/providers.dart';
import '../../shared/models/card.dart';
import '../../shared/models/deck.dart';
import '../../shared/widgets/flip_card.dart';
import '../decks/decks_controller.dart';
import 'cards_controller.dart';

/// Create a card inside [deckId] — mirrors the web design: a live
/// flip-card preview on top, the two essential fields right below it, and
/// everything optional tucked into collapsed sections.
class CardFormPage extends ConsumerStatefulWidget {
  const CardFormPage({required this.deckId, super.key});

  final String deckId;

  @override
  ConsumerState<CardFormPage> createState() => _CardFormPageState();
}

class _CardFormPageState extends ConsumerState<CardFormPage> {
  final _front = TextEditingController();
  final _back = TextEditingController();
  final _partOfSpeech = TextEditingController();
  final _gender = TextEditingController();
  final _pluralForm = TextEditingController();
  final _pronunciation = TextEditingController();
  final _notes = TextEditingController();
  final _flipKey = GlobalKey<FlipCardState>();

  var _hardness = HardnessLevel.medium;
  final _examples = <({TextEditingController sentence, TextEditingController translation})>[];
  final _synonyms = <String>[];
  final _antonyms = <String>[];
  final _tags = <String>[];

  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _addExample();
    for (final c in [_front, _back, _partOfSpeech, _gender, _pronunciation]) {
      c.addListener(_refreshPreview);
    }
  }

  void _refreshPreview() => setState(() {});

  void _addExample() {
    setState(() {
      _examples.add((
        sentence: TextEditingController()..addListener(_refreshPreview),
        translation: TextEditingController()..addListener(_refreshPreview),
      ));
    });
  }

  void _removeExample(int index) {
    final removed = _examples[index];
    setState(() => _examples.removeAt(index));
    removed.sentence.dispose();
    removed.translation.dispose();
  }

  @override
  void dispose() {
    for (final c in [
      _front,
      _back,
      _partOfSpeech,
      _gender,
      _pluralForm,
      _pronunciation,
      _notes,
    ]) {
      c.dispose();
    }
    for (final ex in _examples) {
      ex.sentence.dispose();
      ex.translation.dispose();
    }
    super.dispose();
  }

  bool get _canSave =>
      !_saving && _front.text.trim().isNotEmpty && _back.text.trim().isNotEmpty;

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final examples = [
        for (final ex in _examples)
          if (ex.sentence.text.trim().isNotEmpty ||
              ex.translation.text.trim().isNotEmpty)
            ExampleSentence(
              sentence: ex.sentence.text.trim(),
              translation: ex.translation.text.trim(),
            ),
      ];
      final created =
          await ref.read(cardsControllerProvider.notifier).create(CardCreate(
                front: _front.text.trim(),
                back: _back.text.trim(),
                hardnessLevel: _hardness,
                partOfSpeech: _valueOrNull(_partOfSpeech),
                gender: _valueOrNull(_gender),
                pluralForm: _valueOrNull(_pluralForm),
                pronunciation: _valueOrNull(_pronunciation),
                notes: _valueOrNull(_notes),
                examples: examples.isEmpty ? null : examples,
                synonyms: _synonyms.isEmpty ? null : _synonyms,
                antonyms: _antonyms.isEmpty ? null : _antonyms,
                tags: _tags.isEmpty ? null : _tags,
              ));

      // Attach the new card to the deck it was created from.
      final deck = await ref.read(decksApiProvider).get(widget.deckId);
      await ref.read(decksControllerProvider.notifier).edit(
            widget.deckId,
            DeckUpdate(cardIds: [...deck.cardIds, created.id]),
          );
      ref.invalidate(deckByIdProvider(widget.deckId));

      if (mounted) context.pop();
    } on Exception catch (e) {
      setState(() {
        _saving = false;
        _error = e.toString();
      });
    }
  }

  static String? _valueOrNull(TextEditingController c) {
    final v = c.text.trim();
    return v.isEmpty ? null : v;
  }

  ({String sentence, String translation})? _firstFilledExample() {
    for (final ex in _examples) {
      final sentence = ex.sentence.text.trim();
      if (sentence.isNotEmpty) {
        return (sentence: sentence, translation: ex.translation.text.trim());
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New card')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            _Preview(
              flipKey: _flipKey,
              front: _front.text.trim(),
              back: _back.text.trim(),
              pronunciation: _pronunciation.text.trim(),
              partOfSpeech: _partOfSpeech.text.trim(),
              gender: _gender.text.trim(),
              hardness: _hardness,
              example: _firstFilledExample(),
              tags: _tags,
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _front,
              autofocus: true,
              textCapitalization: TextCapitalization.sentences,
              style: Theme.of(context).textTheme.titleLarge,
              decoration: const InputDecoration(
                labelText: 'Front *',
                hintText: 'Bonjour',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _back,
              minLines: 2,
              maxLines: 4,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Back *',
                hintText: 'Hello',
              ),
            ),
            const SizedBox(height: 16),
            SegmentedButton<HardnessLevel>(
              segments: const [
                ButtonSegment(
                    value: HardnessLevel.easy, label: Text('Easy')),
                ButtonSegment(
                    value: HardnessLevel.medium, label: Text('Medium')),
                ButtonSegment(
                    value: HardnessLevel.hard, label: Text('Hard')),
              ],
              selected: {_hardness},
              onSelectionChanged: (s) => setState(() => _hardness = s.first),
            ),
            const SizedBox(height: 20),
            _Section(
              title: 'Linguistic details',
              children: [
                TextField(
                  controller: _partOfSpeech,
                  decoration: const InputDecoration(
                    labelText: 'Part of speech',
                    hintText: 'noun',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _gender,
                  decoration: const InputDecoration(
                    labelText: 'Gender',
                    hintText: 'masculine',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _pluralForm,
                  decoration: const InputDecoration(
                    labelText: 'Plural form',
                    hintText: 'chats',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _pronunciation,
                  decoration: const InputDecoration(
                    labelText: 'Pronunciation',
                    hintText: '/bɔ̃.ʒuʁ/',
                  ),
                ),
              ],
            ),
            _Section(
              title: 'Examples',
              children: [
                for (var i = 0; i < _examples.length; i++) ...[
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          children: [
                            TextField(
                              controller: _examples[i].sentence,
                              decoration: InputDecoration(
                                labelText: 'Sentence ${i + 1}',
                              ),
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              controller: _examples[i].translation,
                              decoration: const InputDecoration(
                                labelText: 'Translation',
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: _examples.length <= 1
                            ? null
                            : () => _removeExample(i),
                        icon: const Icon(Icons.delete_outline),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                ],
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton.icon(
                    onPressed: _examples.length >= 5 ? null : _addExample,
                    icon: const Icon(Icons.add),
                    label: const Text('Add example'),
                  ),
                ),
              ],
            ),
            _Section(
              title: 'Synonyms & antonyms',
              children: [
                _ChipsField(
                  label: 'Synonyms',
                  values: _synonyms,
                  onChanged: () => setState(() {}),
                ),
                const SizedBox(height: 12),
                _ChipsField(
                  label: 'Antonyms',
                  values: _antonyms,
                  onChanged: () => setState(() {}),
                ),
              ],
            ),
            _Section(
              title: 'Tags & notes',
              children: [
                _ChipsField(
                  label: 'Tags',
                  values: _tags,
                  onChanged: () => setState(() {}),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _notes,
                  minLines: 2,
                  maxLines: 5,
                  decoration: const InputDecoration(
                    labelText: 'Notes',
                    hintText: 'Extra context or mnemonic devices…',
                  ),
                ),
              ],
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _canSave ? _save : null,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _saving
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Create card'),
            ),
          ],
        ),
      ),
    );
  }
}

class _Preview extends StatelessWidget {
  const _Preview({
    required this.flipKey,
    required this.front,
    required this.back,
    required this.pronunciation,
    required this.partOfSpeech,
    required this.gender,
    required this.hardness,
    required this.example,
    required this.tags,
  });

  final GlobalKey<FlipCardState> flipKey;
  final String front;
  final String back;
  final String pronunciation;
  final String partOfSpeech;
  final String gender;
  final HardnessLevel hardness;
  final ({String sentence, String translation})? example;
  final List<String> tags;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 220,
          child: FlipCard(
            key: flipKey,
            front: _Face(
              accent: Theme.of(context).colorScheme.primary,
              label: 'FRONT',
              trailing: _HardnessChip(hardness),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    front.isEmpty ? 'Front side' : front,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: front.isEmpty
                              ? Theme.of(context).colorScheme.outline
                              : null,
                        ),
                  ),
                  if (pronunciation.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      pronunciation,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                  if (partOfSpeech.isNotEmpty || gender.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 6,
                      alignment: WrapAlignment.center,
                      children: [
                        if (partOfSpeech.isNotEmpty)
                          Chip(
                            label: Text(partOfSpeech),
                            visualDensity: VisualDensity.compact,
                          ),
                        if (gender.isNotEmpty)
                          Chip(
                            label: Text(gender),
                            visualDensity: VisualDensity.compact,
                          ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            back: _Face(
              accent: Theme.of(context).colorScheme.secondary,
              label: 'BACK',
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    back.isEmpty ? 'Back side' : back,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: back.isEmpty
                              ? Theme.of(context).colorScheme.outline
                              : null,
                        ),
                  ),
                  if (example != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      example!.sentence,
                      textAlign: TextAlign.center,
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(fontStyle: FontStyle.italic),
                    ),
                    if (example!.translation.isNotEmpty)
                      Text(
                        example!.translation,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                  ],
                  if (tags.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 6,
                      alignment: WrapAlignment.center,
                      children: [
                        for (final tag in tags.take(4))
                          Chip(
                            label: Text(tag),
                            visualDensity: VisualDensity.compact,
                          ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Tap the card to flip it',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.outline,
              ),
        ),
      ],
    );
  }
}

class _Face extends StatelessWidget {
  const _Face({
    required this.accent,
    required this.label,
    required this.child,
    this.trailing,
  });

  final Color accent;
  final String label;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: scheme.outlineVariant),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            accent.withValues(alpha: 0.08),
            scheme.surface,
          ],
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: scheme.outline,
                      letterSpacing: 1.2,
                    ),
              ),
              if (trailing != null) trailing!,
            ],
          ),
          Expanded(child: Center(child: child)),
        ],
      ),
    );
  }
}

class _HardnessChip extends StatelessWidget {
  const _HardnessChip(this.hardness);

  final HardnessLevel hardness;

  @override
  Widget build(BuildContext context) {
    final color = switch (hardness) {
      HardnessLevel.easy => Colors.green,
      HardnessLevel.medium => Colors.orange,
      HardnessLevel.hard => Colors.red,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color),
      ),
      child: Text(
        hardness.wire,
        style: TextStyle(color: color, fontSize: 12),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        border: Border.all(color: scheme.outlineVariant),
        borderRadius: BorderRadius.circular(16),
      ),
      clipBehavior: Clip.antiAlias,
      child: Theme(
        // Hide ExpansionTile's default divider lines.
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          title: Text(
            title,
            style: Theme.of(context).textTheme.titleSmall,
          ),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          children: children,
        ),
      ),
    );
  }
}

/// Chip-entry field: type a value, press the add button or submit to turn
/// it into a chip; tap a chip's ✕ to remove it.
class _ChipsField extends StatefulWidget {
  const _ChipsField({
    required this.label,
    required this.values,
    required this.onChanged,
  });

  final String label;
  final List<String> values;
  final VoidCallback onChanged;

  @override
  State<_ChipsField> createState() => _ChipsFieldState();
}

class _ChipsFieldState extends State<_ChipsField> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _add() {
    final value = _controller.text.trim();
    if (value.isEmpty || widget.values.contains(value)) return;
    widget.values.add(value);
    _controller.clear();
    widget.onChanged();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: _controller,
          decoration: InputDecoration(
            labelText: widget.label,
            hintText: 'Type and press ⏎',
            suffixIcon: IconButton(
              icon: const Icon(Icons.add),
              onPressed: _add,
            ),
          ),
          onSubmitted: (_) => _add(),
        ),
        if (widget.values.isNotEmpty) ...[
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final value in widget.values)
                InputChip(
                  label: Text(value),
                  onDeleted: () {
                    widget.values.remove(value);
                    widget.onChanged();
                  },
                ),
            ],
          ),
        ],
      ],
    );
  }
}
