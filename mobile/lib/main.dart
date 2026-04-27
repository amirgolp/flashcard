import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/auth/auth_controller.dart';
import 'core/auth/auth_service.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

void main() {
  runApp(
    ProviderScope(
      overrides: [
        // Wire the controller-backed AuthService into the API client so
        // the auth interceptor can call back into the state machine on
        // session invalidation.
        authServiceProvider
            .overrideWith((ref) => ref.watch(liveAuthServiceProvider)),
      ],
      child: const FlashcardApp(),
    ),
  );
}

class FlashcardApp extends ConsumerWidget {
  const FlashcardApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      title: 'Flashcard',
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.system,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
