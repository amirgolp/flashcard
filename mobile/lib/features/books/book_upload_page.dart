import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_exception.dart';
import 'books_controller.dart';

class BookUploadPage extends ConsumerStatefulWidget {
  const BookUploadPage({super.key});

  @override
  ConsumerState<BookUploadPage> createState() => _BookUploadPageState();
}

class _BookUploadPageState extends ConsumerState<BookUploadPage> {
  final _formKey = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _targetLang = TextEditingController();
  final _nativeLang = TextEditingController();

  PlatformFile? _file;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _title.dispose();
    _targetLang.dispose();
    _nativeLang.dispose();
    super.dispose();
  }

  Future<void> _pickFile() async {
    setState(() => _error = null);
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf'],
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;
    setState(() {
      _file = result.files.single;
      if (_title.text.isEmpty) {
        _title.text = _file!.name.replaceAll(RegExp(r'\.pdf$'), '');
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() || _file == null) {
      setState(() {
        _error = _file == null ? 'Pick a PDF first.' : null;
      });
      return;
    }
    final bytes = _file!.bytes;
    if (bytes == null) {
      setState(() => _error = 'Could not read the selected file.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(booksControllerProvider.notifier).register(
            bytes: Uint8List.fromList(bytes),
            filename: _file!.name,
            title: _title.text.trim(),
            targetLanguage: _targetLang.text.trim().isEmpty
                ? null
                : _targetLang.text.trim(),
            nativeLanguage: _nativeLang.text.trim().isEmpty
                ? null
                : _nativeLang.text.trim(),
          );
      if (mounted) context.pop();
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _busy = false;
      });
    } on Object catch (e) {
      // Local steps (PDF parsing, drift insert, file write) can throw
      // arbitrary errors; surface them so the user can retry.
      setState(() {
        _error = 'Could not register book: $e';
        _busy = false;
      });
    } finally {
      if (mounted && _error == null) {
        setState(() => _busy = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final busy = _busy;
    return Scaffold(
      appBar: AppBar(title: const Text('Add book')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _FilePickerTile(
                  file: _file,
                  onPick: busy ? null : _pickFile,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _title,
                  decoration: const InputDecoration(labelText: 'Title'),
                  validator: (v) => (v == null || v.trim().isEmpty)
                      ? 'Title is required'
                      : null,
                  enabled: !busy,
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _targetLang,
                        decoration: const InputDecoration(
                            labelText: 'Target language'),
                        enabled: !busy,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _nativeLang,
                        decoration: const InputDecoration(
                            labelText: 'Native language'),
                        enabled: !busy,
                      ),
                    ),
                  ],
                ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    _error!,
                    style: TextStyle(
                        color: Theme.of(context).colorScheme.error),
                  ),
                ],
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: busy ? null : _submit,
                  child: busy
                      ? const Text('Saving…')
                      : const Text('Add book'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FilePickerTile extends StatelessWidget {
  const _FilePickerTile({required this.file, required this.onPick});

  final PlatformFile? file;
  final VoidCallback? onPick;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.picture_as_pdf_outlined),
        title: Text(file?.name ?? 'Pick a PDF'),
        subtitle: file == null
            ? const Text('Tap to select')
            : Text('${(file!.size / 1024).round()} KB'),
        trailing: const Icon(Icons.attach_file),
        onTap: onPick,
      ),
    );
  }
}
