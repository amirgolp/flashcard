import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/connectivity/connectivity_provider.dart';
import '../../core/db/card_cache_service.dart';
import '../../core/router/app_router.dart';

class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({required this.child, super.key});

  final Widget child;

  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();

  static const _tabs = <_NavTab>[
    _NavTab(
      label: 'Decks',
      route: AppRoutes.decks,
      icon: Icons.style_outlined,
      selectedIcon: Icons.style,
    ),
    _NavTab(
      label: 'Books',
      route: AppRoutes.books,
      icon: Icons.menu_book_outlined,
      selectedIcon: Icons.menu_book,
    ),
    _NavTab(
      label: 'Review',
      route: AppRoutes.review,
      icon: Icons.bolt_outlined,
      selectedIcon: Icons.bolt,
    ),
    _NavTab(
      label: 'Settings',
      route: AppRoutes.settings,
      icon: Icons.settings_outlined,
      selectedIcon: Icons.settings,
    ),
  ];
}

class _HomeShellState extends ConsumerState<HomeShell> {
  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final selected =
        HomeShell._tabs.indexWhere((t) => t.route == location);
    final connectivity = ref.watch(connectivityProvider);

    // When connectivity flips to online, opportunistically drain the
    // offline queue.
    ref.listen<AsyncValue<bool>>(connectivityProvider, (prev, next) {
      final wasOffline = prev?.value == false;
      final nowOnline = next.value == true;
      if (wasOffline && nowOnline) {
        Future<void>(() async {
          try {
            await ref.read(cardCacheServiceProvider).drainPending();
          } on Object {
            // Best-effort drain.
          }
        });
      }
    });

    final isOffline = connectivity.maybeWhen(
      data: (online) => !online,
      orElse: () => false,
    );

    return Scaffold(
      body: Column(
        children: [
          if (isOffline) const _OfflineBanner(),
          Expanded(child: widget.child),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: selected < 0 ? 0 : selected,
        destinations: [
          for (final tab in HomeShell._tabs)
            NavigationDestination(
              icon: Icon(tab.icon),
              selectedIcon: Icon(tab.selectedIcon),
              label: tab.label,
              tooltip: tab.label,
            ),
        ],
        onDestinationSelected: (i) =>
            context.go(HomeShell._tabs[i].route),
      ),
    );
  }
}

class _OfflineBanner extends StatelessWidget {
  const _OfflineBanner();

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Material(
      color: scheme.errorContainer,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              Icon(Icons.cloud_off, color: scheme.onErrorContainer, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'You are offline. Cached decks remain reviewable; '
                  'changes will sync when you are back online.',
                  style: TextStyle(color: scheme.onErrorContainer),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavTab {
  const _NavTab({
    required this.label,
    required this.route,
    required this.icon,
    required this.selectedIcon,
  });
  final String label;
  final String route;
  final IconData icon;
  final IconData selectedIcon;
}
