import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_exception.dart';
import '../../shared/models/deck.dart';
import 'decks_controller.dart';

/// Used for both create (id == null) and edit (id supplied).
class DeckFormPage extends ConsumerStatefulWidget {
  const DeckFormPage({this.deckId, this.initialName, this.initialDescription, super.key});

  final String? deckId;
  final String? initialName;
  final String? initialDescription;

  @override
  ConsumerState<DeckFormPage> createState() => _DeckFormPageState();
}

class _DeckFormPageState extends ConsumerState<DeckFormPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _description;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.initialName ?? '');
    _description = TextEditingController(text: widget.initialDescription ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final controller = ref.read(decksControllerProvider.notifier);
      final desc =
          _description.text.trim().isEmpty ? null : _description.text.trim();
      if (widget.deckId == null) {
        await controller.create(
          DeckCreate(name: _name.text.trim(), description: desc),
        );
      } else {
        await controller.edit(
          widget.deckId!,
          DeckUpdate(name: _name.text.trim(), description: desc),
        );
      }
      if (mounted) context.pop();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.deckId != null;
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Edit deck' : 'New deck'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'Name'),
                  validator: (v) => (v == null || v.trim().isEmpty)
                      ? 'Name is required'
                      : null,
                  textInputAction: TextInputAction.next,
                  enabled: !_busy,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _description,
                  decoration: const InputDecoration(labelText: 'Description'),
                  maxLines: 3,
                  enabled: !_busy,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Text(_error!,
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.error)),
                ],
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _busy ? null : _submit,
                  child: _busy
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(isEdit ? 'Save' : 'Create'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
