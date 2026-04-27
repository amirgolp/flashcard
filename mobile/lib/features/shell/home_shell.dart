import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_router.dart';

class HomeShell extends StatelessWidget {
  const HomeShell({required this.child, super.key});

  final Widget child;

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

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final selected = _tabs.indexWhere((t) => t.route == location);
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selected < 0 ? 0 : selected,
        destinations: [
          for (final tab in _tabs)
            NavigationDestination(
              icon: Icon(tab.icon),
              selectedIcon: Icon(tab.selectedIcon),
              label: tab.label,
            ),
        ],
        onDestinationSelected: (i) => context.go(_tabs[i].route),
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
