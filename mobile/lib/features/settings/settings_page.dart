import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/providers.dart';
import '../../core/auth/auth_controller.dart';

class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final baseUrl = ref.watch(apiBaseUrlProvider);
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
            leading: const Icon(Icons.logout),
            title: const Text('Log out'),
            onTap: () =>
                ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
    );
  }
}
