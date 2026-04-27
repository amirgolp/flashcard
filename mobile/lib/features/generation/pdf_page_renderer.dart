import 'dart:convert';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pdfrx/pdfrx.dart';

import '../../shared/models/image_generation.dart';
import 'image_compression.dart';

/// Renders a contiguous range of pages from a local PDF and returns
/// them as base64-encoded JPEG [ImagePart]s ready to ship to the
/// `/generate/from-images` endpoint.
///
/// Implementations are injected via [pdfPageRendererProvider] so tests
/// can stub the FFI-heavy pdfrx path entirely.
abstract class PdfPageRenderer {
  Future<List<ImagePart>> renderRange({
    required String filePath,
    required int startPage,
    required int endPage,
    int maxDimension = 1600,
    int jpegQuality = 80,
  });
}

/// Real implementation that opens the PDF with pdfrx, rasterizes each
/// page in the range, downsamples to [maxDimension] on the long edge,
/// JPEG-compresses with [flutter_image_compress], and base64-encodes.
class PdfrxPageRenderer implements PdfPageRenderer {
  const PdfrxPageRenderer({this.compressor = const ImageCompressor()});

  final ImageCompressor compressor;

  @override
  Future<List<ImagePart>> renderRange({
    required String filePath,
    required int startPage,
    required int endPage,
    int maxDimension = 1600,
    int jpegQuality = 80,
  }) async {
    if (startPage < 1 || endPage < startPage) {
      throw ArgumentError(
        'invalid range: startPage=$startPage endPage=$endPage',
      );
    }

    final doc = await PdfDocument.openFile(filePath);
    try {
      if (endPage > doc.pages.length) {
        throw ArgumentError(
          'endPage=$endPage exceeds document length ${doc.pages.length}',
        );
      }

      final parts = <ImagePart>[];
      for (var p = startPage; p <= endPage; p++) {
        final page = doc.pages[p - 1];
        final pdfImage = await page.render();
        if (pdfImage == null) {
          throw StateError('pdfrx returned no image for page $p');
        }
        try {
          final ui.Image uiImage =
              await pdfImage.createImage(pixelSizeThreshold: maxDimension);
          try {
            final pngData =
                await uiImage.toByteData(format: ui.ImageByteFormat.png);
            if (pngData == null) {
              throw StateError('toByteData returned null for page $p');
            }
            final jpeg = await compressor.compressBytes(
              pngData.buffer.asUint8List(),
              maxDimension: maxDimension,
              quality: jpegQuality,
            );
            parts.add(ImagePart(
              imageBase64: base64Encode(jpeg),
              sourcePage: p,
            ));
          } finally {
            uiImage.dispose();
          }
        } finally {
          pdfImage.dispose();
        }
      }
      return parts;
    } finally {
      doc.dispose();
    }
  }
}

/// Provider hook for the PDF page renderer. Defaults to the
/// pdfrx-backed implementation; tests override this with a stub.
final pdfPageRendererProvider =
    Provider<PdfPageRenderer>((_) => const PdfrxPageRenderer());

@visibleForTesting
class StubPdfPageRenderer implements PdfPageRenderer {
  StubPdfPageRenderer(this._handler);

  final Future<List<ImagePart>> Function({
    required String filePath,
    required int startPage,
    required int endPage,
    int maxDimension,
    int jpegQuality,
  }) _handler;

  @override
  Future<List<ImagePart>> renderRange({
    required String filePath,
    required int startPage,
    required int endPage,
    int maxDimension = 1600,
    int jpegQuality = 80,
  }) =>
      _handler(
        filePath: filePath,
        startPage: startPage,
        endPage: endPage,
        maxDimension: maxDimension,
        jpegQuality: jpegQuality,
      );
}
