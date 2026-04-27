import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_image_compress/flutter_image_compress.dart';

/// Compresses an image to a sane size for upload. Defaults aim for
/// ~250 KB per page on typical handwritten notes — quality 80, max
/// dimension 1600px, JPEG.
class ImageCompressor {
  const ImageCompressor();

  Future<Uint8List> compressBytes(
    Uint8List source, {
    int maxDimension = 1600,
    int quality = 80,
  }) async {
    final result = await FlutterImageCompress.compressWithList(
      source,
      minWidth: maxDimension,
      minHeight: maxDimension,
      quality: quality,
      format: CompressFormat.jpeg,
    );
    return Uint8List.fromList(result);
  }

  String toBase64(Uint8List bytes) => base64Encode(bytes);
}
