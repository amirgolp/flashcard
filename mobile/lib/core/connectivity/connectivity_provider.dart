import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// True when the device has at least one active connection. We don't
/// care which transport — just that requests have a chance of going
/// through. Drives the offline banner + opportunistic queue drains.
final connectivityProvider = StreamProvider<bool>((ref) async* {
  final connectivity = Connectivity();
  final initial = await connectivity.checkConnectivity();
  yield initial.any((c) => c != ConnectivityResult.none);
  await for (final results in connectivity.onConnectivityChanged) {
    yield results.any((c) => c != ConnectivityResult.none);
  }
});
