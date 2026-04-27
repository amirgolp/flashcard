import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Holds the current [ThemeMode] and persists it to SharedPreferences.
/// Theme is non-sensitive so it doesn't need the secure store.
class ThemeModeController extends Notifier<ThemeMode> {
  static const _key = 'flashcard.theme_mode';

  @override
  ThemeMode build() {
    _hydrate();
    return ThemeMode.system;
  }

  Future<void> _hydrate() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_key);
      if (raw == null) return;
      state = ThemeMode.values.firstWhere(
        (m) => m.name == raw,
        orElse: () => ThemeMode.system,
      );
    } on Object {
      // SharedPreferences isn't wired in unit tests; fall back to system.
    }
  }

  Future<void> set(ThemeMode mode) async {
    state = mode;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, mode.name);
    } on Object {
      // Persistence failure is non-fatal; the in-memory value still
      // takes effect for the running session.
    }
  }
}

final themeModeProvider =
    NotifierProvider<ThemeModeController, ThemeMode>(ThemeModeController.new);
