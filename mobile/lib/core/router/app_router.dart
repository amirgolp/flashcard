import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/login_page.dart';
import '../../features/auth/register_page.dart';
import '../../features/auth/splash_page.dart';
import '../../features/books/book_detail_page.dart';
import '../../features/books/book_upload_page.dart';
import '../../features/books/books_page.dart';
import '../../features/cards/review_page.dart';
import '../../features/cards/review_session_page.dart';
import '../../features/decks/deck_detail_page.dart';
import '../../features/decks/deck_form_page.dart';
import '../../features/decks/decks_page.dart';
import '../../features/generation/drafts_review_page.dart';
import '../../features/settings/settings_page.dart';
import '../../features/shell/home_shell.dart';
import '../auth/auth_controller.dart';
import '../auth/auth_state.dart';

class AppRoutes {
  AppRoutes._();
  static const splash = '/splash';
  static const login = '/login';
  static const register = '/register';
  static const decks = '/decks';
  static const books = '/books';
  static const review = '/review';
  static const settings = '/settings';
}

final appRouterProvider = Provider<GoRouter>((ref) {
  final refreshable = _AuthRouterRefresh(ref);
  ref.onDispose(refreshable.dispose);

  return GoRouter(
    initialLocation: AppRoutes.splash,
    refreshListenable: refreshable,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final loc = state.matchedLocation;

      final atSplash = loc == AppRoutes.splash;
      final atAuthPage =
          loc == AppRoutes.login || loc == AppRoutes.register;

      if (auth.status == AuthStatus.unknown) {
        return atSplash ? null : AppRoutes.splash;
      }
      if (auth.status == AuthStatus.unauthenticated) {
        return atAuthPage ? null : AppRoutes.login;
      }
      if (auth.isAuthenticated && (atSplash || atAuthPage)) {
        return AppRoutes.decks;
      }
      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (_, __) => const SplashPage(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (_, __) => const LoginPage(),
      ),
      GoRoute(
        path: AppRoutes.register,
        builder: (_, __) => const RegisterPage(),
      ),
      // Book-scoped pages live OUTSIDE the shell.
      GoRoute(
        path: '${AppRoutes.books}/upload',
        builder: (_, __) => const BookUploadPage(),
      ),
      GoRoute(
        path: '${AppRoutes.books}/:id',
        builder: (_, state) =>
            BookDetailPage(bookId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '${AppRoutes.books}/:id/drafts',
        builder: (_, state) => DraftsReviewPage(
          bookId: state.pathParameters['id']!,
          batchId: state.uri.queryParameters['batch'],
        ),
      ),
      // Deck-scoped pages live OUTSIDE the shell so the bottom nav doesn't
      // appear during a focused review session or form fill.
      GoRoute(
        path: '${AppRoutes.decks}/new',
        builder: (_, __) => const DeckFormPage(),
      ),
      GoRoute(
        path: '${AppRoutes.decks}/:id',
        builder: (_, state) =>
            DeckDetailPage(deckId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '${AppRoutes.decks}/:id/edit',
        builder: (_, state) {
          final extra = state.extra as Map<String, Object?>?;
          return DeckFormPage(
            deckId: state.pathParameters['id'],
            initialName: extra?['name'] as String?,
            initialDescription: extra?['description'] as String?,
          );
        },
      ),
      GoRoute(
        path: '${AppRoutes.decks}/:id/review',
        builder: (_, state) =>
            ReviewSessionPage(deckId: state.pathParameters['id']!),
      ),
      ShellRoute(
        builder: (context, state, child) => HomeShell(child: child),
        routes: [
          GoRoute(
            path: AppRoutes.decks,
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: DecksPage()),
          ),
          GoRoute(
            path: AppRoutes.books,
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: BooksPage()),
          ),
          GoRoute(
            path: AppRoutes.review,
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: ReviewPage()),
          ),
          GoRoute(
            path: AppRoutes.settings,
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: SettingsPage()),
          ),
        ],
      ),
    ],
  );
});

class _AuthRouterRefresh extends ChangeNotifier {
  _AuthRouterRefresh(this._ref) {
    _sub = _ref.listen<AuthState>(
      authControllerProvider,
      (_, __) => notifyListeners(),
      fireImmediately: false,
    );
  }

  final Ref _ref;
  late final ProviderSubscription<AuthState> _sub;

  @override
  void dispose() {
    _sub.close();
    super.dispose();
  }
}
