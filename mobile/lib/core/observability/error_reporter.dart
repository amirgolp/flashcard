import 'dart:async';
import 'dart:developer' as developer;

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Domain-level interface for crash + error reporting. The default
/// implementation just funnels through dart:developer.log so dev/CI
/// builds get readable logs; ship a [SentryErrorReporter]-style adapter
/// when SENTRY_DSN is configured.
abstract class ErrorReporter {
  void recordError(
    Object error,
    StackTrace? stack, {
    String? context,
    Map<String, Object?> extra = const {},
    bool fatal = false,
  });
}

class LoggingErrorReporter implements ErrorReporter {
  const LoggingErrorReporter();

  @override
  void recordError(
    Object error,
    StackTrace? stack, {
    String? context,
    Map<String, Object?> extra = const {},
    bool fatal = false,
  }) {
    developer.log(
      error.toString(),
      name: context ?? 'flashcard',
      error: error,
      stackTrace: stack,
      level: fatal ? 1000 : 900, // SEVERE / WARNING-ish
    );
    if (kDebugMode && extra.isNotEmpty) {
      developer.log('extra: $extra', name: context ?? 'flashcard');
    }
  }
}

final errorReporterProvider =
    Provider<ErrorReporter>((ref) => const LoggingErrorReporter());

/// Wraps `runApp` with a zone-guarded handler so synchronous + async
/// uncaught errors land in the reporter.
void runGuardedApp(
  void Function() body, {
  required ErrorReporter reporter,
}) {
  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    reporter.recordError(
      details.exception,
      details.stack,
      context: details.library ?? 'flutter',
      fatal: details.silent == false,
    );
  };
  PlatformDispatcher.instance.onError = (error, stack) {
    reporter.recordError(error, stack, context: 'platform_dispatcher');
    return true;
  };
  runZonedGuarded(body, (error, stack) {
    reporter.recordError(error, stack, context: 'zone_guarded');
  });
}
