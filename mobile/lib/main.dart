import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/auth/auth_controller.dart';
import 'core/auth/auth_service.dart';
import 'core/observability/error_reporter.dart';
import 'core/preferences/prefs_provider.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

void main() {
  const reporter = LoggingErrorReporter();
  runGuardedApp(
    () => runApp(
      ProviderScope(
        overrides: [
          errorReporterProvider.overrideWithValue(reporter),
          // Wire the controller-backed AuthService into the API client.
          authServiceProvider
              .overrideWith((ref) => ref.watch(liveAuthServiceProvider)),
        ],
        child: const FlashcardApp(),
      ),
    ),
    reporter: reporter,
  );
}

class FlashcardApp extends ConsumerWidget {
  const FlashcardApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final themeMode = ref.watch(themeModeProvider);
    return MaterialApp.router(
      title: 'Flashcard',
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
