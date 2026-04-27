import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Whether the host platform exposes a usable camera UI through
/// `image_picker`. Only iOS and Android ship a real camera plugin;
/// the desktop and web image_picker implementations either throw on
/// `ImageSource.camera` or have no working code path.
///
/// Pure function so the platform-gating logic is unit-testable
/// without a widget tree or `Platform` mocks.
bool cameraAvailableForPlatform(TargetPlatform platform, {required bool isWeb}) {
  if (isWeb) return false;
  return platform == TargetPlatform.android ||
      platform == TargetPlatform.iOS;
}

/// Riverpod hook that the UI watches to decide whether to render the
/// "Camera" capture button. Defaults to the host's actual platform;
/// tests override the provider to drive both branches.
final cameraAvailableProvider = Provider<bool>(
  (_) => cameraAvailableForPlatform(defaultTargetPlatform, isWeb: kIsWeb),
);
