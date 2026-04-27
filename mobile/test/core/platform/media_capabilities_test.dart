import 'package:flashcard_mobile/core/platform/media_capabilities.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('cameraAvailableForPlatform', () {
    test('true on Android and iOS', () {
      expect(
        cameraAvailableForPlatform(TargetPlatform.android, isWeb: false),
        isTrue,
      );
      expect(
        cameraAvailableForPlatform(TargetPlatform.iOS, isWeb: false),
        isTrue,
      );
    });

    test('false on desktop platforms', () {
      for (final p in const [
        TargetPlatform.linux,
        TargetPlatform.macOS,
        TargetPlatform.windows,
        TargetPlatform.fuchsia,
      ]) {
        expect(
          cameraAvailableForPlatform(p, isWeb: false),
          isFalse,
          reason: 'expected no camera support on $p',
        );
      }
    });

    test('false on web regardless of reported TargetPlatform', () {
      // The web build can report any TargetPlatform (it mimics the
      // host UA), but image_picker has no working camera path there.
      expect(
        cameraAvailableForPlatform(TargetPlatform.android, isWeb: true),
        isFalse,
      );
      expect(
        cameraAvailableForPlatform(TargetPlatform.iOS, isWeb: true),
        isFalse,
      );
    });
  });
}
