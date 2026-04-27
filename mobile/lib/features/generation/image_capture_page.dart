import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/api/api_exception.dart';
import '../../core/api/providers.dart';
import '../../core/platform/media_capabilities.dart';
import '../../core/router/app_router.dart';
import '../../shared/models/image_generation.dart';
import 'image_compression.dart';

class ImageCapturePage extends ConsumerStatefulWidget {
  const ImageCapturePage({required this.bookId, this.sourcePage, super.key});

  final String bookId;
  final int? sourcePage;

  @override
  ConsumerState<ImageCapturePage> createState() => _ImageCapturePageState();
}

class _ImageCapturePageState extends ConsumerState<ImageCapturePage> {
  final ImagePicker _picker = ImagePicker();
  final ImageCompressor _compressor = const ImageCompressor();

  Uint8List? _preview;
  String? _filename;
  bool _busy = false;
  String? _error;
  String? _lastBatchId;
  int _numCards = 10;

  Future<void> _pickFromCamera() async {
    final shot = await _picker.pickImage(
      source: ImageSource.camera,
      preferredCameraDevice: CameraDevice.rear,
      maxWidth: 2400,
      imageQuality: 95, // raw quality; compression below shrinks it
    );
    await _useFile(shot);
  }

  Future<void> _pickFromGallery() async {
    final shot = await _picker.pickImage(source: ImageSource.gallery);
    await _useFile(shot);
  }

  Future<void> _useFile(XFile? file) async {
    if (file == null) return;
    final raw = await file.readAsBytes();
    final compressed = await _compressor.compressBytes(raw);
    if (!mounted) return;
    setState(() {
      _preview = compressed;
      _filename = file.name;
      _error = null;
    });
  }

  Future<void> _submit() async {
    final image = _preview;
    if (image == null) {
      setState(() => _error = 'Capture or pick a photo first.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final response = await ref.read(generationApiProvider).fromImage(
            GenerateFromImageRequest(
              imageBase64: _compressor.toBase64(image),
              bookId: widget.bookId,
              numCards: _numCards,
              sourcePage: widget.sourcePage,
            ),
          );
      setState(() => _lastBatchId = response.batchId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(response.message)),
        );
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cameraAvailable = ref.watch(cameraAvailableProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text(cameraAvailable ? 'Capture page' : 'Pick page image'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: _PreviewArea(
                  preview: _preview,
                  filename: _filename,
                  cameraAvailable: cameraAvailable,
                ),
              ),
              const SizedBox(height: 12),
              if (cameraAvailable)
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _busy ? null : _pickFromCamera,
                        icon: const Icon(Icons.photo_camera_outlined),
                        label: const Text('Camera'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _busy ? null : _pickFromGallery,
                        icon: const Icon(Icons.photo_library_outlined),
                        label: const Text('Gallery'),
                      ),
                    ),
                  ],
                )
              else
                OutlinedButton.icon(
                  onPressed: _busy ? null : _pickFromGallery,
                  icon: const Icon(Icons.image_outlined),
                  label: const Text('Pick image'),
                ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: Text('Cards to generate: $_numCards')),
                  Slider(
                    value: _numCards.toDouble(),
                    min: 5,
                    max: 30,
                    divisions: 5,
                    label: '$_numCards',
                    onChanged: _busy
                        ? null
                        : (v) => setState(() => _numCards = v.round()),
                  ),
                ],
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!,
                    style: TextStyle(
                        color: Theme.of(context).colorScheme.error)),
              ],
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: _busy ? null : _submit,
                icon: const Icon(Icons.auto_awesome),
                label: _busy
                    ? const Text('Generating…')
                    : const Text('Generate cards'),
              ),
              if (_lastBatchId != null) ...[
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () => context.push(
                    '${AppRoutes.books}/${widget.bookId}/drafts'
                    '?batch=$_lastBatchId',
                  ),
                  icon: const Icon(Icons.rate_review_outlined),
                  label: const Text('Review drafts'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _PreviewArea extends StatelessWidget {
  const _PreviewArea({
    required this.preview,
    required this.filename,
    required this.cameraAvailable,
  });

  final Uint8List? preview;
  final String? filename;
  final bool cameraAvailable;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    if (preview == null) {
      return Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: scheme.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: scheme.outlineVariant),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            cameraAvailable
                ? 'Capture a photo of the page or pick one from the gallery.'
                : 'Pick an image of the page from your files.',
            textAlign: TextAlign.center,
            style: TextStyle(color: scheme.onSurfaceVariant),
          ),
        ),
      );
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Image.memory(preview!, fit: BoxFit.contain),
    );
  }
}
