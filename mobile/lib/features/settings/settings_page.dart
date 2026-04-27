import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../core/api/providers.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/db/card_cache_service.dart';
import '../../core/preferences/prefs_provider.dart';

final _packageInfoProvider =
    FutureProvider<PackageInfo>((_) => PackageInfo.fromPlatform());

final _pendingSyncProvider = FutureProvider<int>((ref) async {
  return ref.read(cardCacheServiceProvider).pendingCount();
});

class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final baseUrl = ref.watch(apiBaseUrlProvider);
    final themeMode = ref.watch(themeModeProvider);
    final pkg = ref.watch(_packageInfoProvider);
    final pending = ref.watch(_pendingSyncProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('Signed in as'),
            subtitle: Text(auth.user?.username ?? '—'),
          ),
          ListTile(
            leading: const Icon(Icons.cloud_outlined),
            title: const Text('API server'),
            subtitle: Text(baseUrl),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.palette_outlined),
            title: const Text('Theme'),
            subtitle: Text(_themeLabel(themeMode)),
            trailing: DropdownButton<ThemeMode>(
              value: themeMode,
              onChanged: (mode) {
                if (mode != null) {
                  ref.read(themeModeProvider.notifier).set(mode);
                }
              },
              items: const [
                DropdownMenuItem(
                  value: ThemeMode.system,
                  child: Text('System'),
                ),
                DropdownMenuItem(
                  value: ThemeMode.light,
                  child: Text('Light'),
                ),
                DropdownMenuItem(
                  value: ThemeMode.dark,
                  child: Text('Dark'),
                ),
              ],
            ),
          ),
          const Divider(),
          pending.when(
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
            data: (count) => count == 0
                ? const SizedBox.shrink()
                : ListTile(
                    leading: const Icon(Icons.sync_problem),
                    title: Text('$count pending hardness updates'),
                    subtitle: const Text(
                      'Will sync automatically when online.',
                    ),
                  ),
          ),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('App version'),
            subtitle: pkg.when(
              loading: () => const Text('…'),
              error: (e, _) => Text(e.toString()),
              data: (info) => Text('${info.version} (build ${info.buildNumber})'),
            ),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Log out'),
            onTap: () =>
                ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
    );
  }

  String _themeLabel(ThemeMode mode) => switch (mode) {
        ThemeMode.system => 'Follow system',
        ThemeMode.light => 'Always light',
        ThemeMode.dark => 'Always dark',
      };
}
