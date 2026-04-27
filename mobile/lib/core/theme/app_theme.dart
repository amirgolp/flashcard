import 'package:flutter/material.dart';

class AppTheme {
  AppTheme._();

  static const _seed = Color(0xFF3F51B5);

  static ThemeData light() => ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: _seed),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(centerTitle: true),
      );

  static ThemeData dark() => ThemeData(
        colorScheme:
            ColorScheme.fromSeed(seedColor: _seed, brightness: Brightness.dark),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(centerTitle: true),
      );
}
