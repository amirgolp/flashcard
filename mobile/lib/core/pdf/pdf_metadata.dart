import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pdfrx/pdfrx.dart';

/// Returns the page count of the PDF carried in [bytes].
typedef PdfPageCounter = Future<int> Function(Uint8List bytes);

/// Lightweight helpers around `pdfrx` for the device-only book flow.
///
/// `pdfrx` ships native PDF rendering across iOS, Android, macOS,
/// Windows, and Linux, so the same code path covers every target.
/// `pdfrxFlutterInitialize` must have been called once during app
/// startup before these helpers run.
class PdfMetadata {
  PdfMetadata._();

  /// Opens the supplied PDF bytes just long enough to read the page
  /// count, then disposes the document.
  ///
  /// Throws if the bytes don't parse as a PDF.
  static Future<int> pageCountFromBytes(Uint8List bytes) async {
    final doc = await PdfDocument.openData(bytes);
    try {
      return doc.pages.length;
    } finally {
      doc.dispose();
    }
  }
}

/// Provider hook for the PDF page-counter. Defaults to the real
/// pdfrx-backed implementation; tests override this with a stub so
/// they don't need pdfium to load (FFI/isolate plumbing isn't
/// available in `flutter test`).
final pdfPageCounterProvider =
    Provider<PdfPageCounter>((_) => PdfMetadata.pageCountFromBytes);
