import 'package:flutter/material.dart';

class KaruTheme {
  // ── Warna Utama ──────────────────────────────────────────────
  static const Color primary = Color(0xFF2E7D32);       // Hijau tua
  static const Color primaryLight = Color(0xFF4CAF50);  // Hijau terang
  static const Color primaryDark = Color(0xFF1B5E20);   // Hijau gelap
  static const Color accent = Color(0xFF81C784);        // Hijau muda

  static const Color secondary = Color(0xFF1565C0);     // Biru gelap
  static const Color secondaryLight = Color(0xFF1976D2);

  static const Color background = Color(0xFFF1F8E9);    // Hijau sangat muda
  static const Color splashBackground = Color(0xFF040D0B); // Sangat gelap untuk splash
  static const Color surface = Color(0xFFFFFFFF);
  static const Color error = Color(0xFFD32F2F);

  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textOnPrimary = Color(0xFFFFFFFF);

  // ── Light Theme ───────────────────────────────────────────────
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: const ColorScheme.light(
        primary: primary,
        primaryContainer: primaryLight,
        secondary: secondary,
        surface: surface,
        surfaceContainerHighest: background,
        error: error,
        onPrimary: textOnPrimary,
        onSecondary: textOnPrimary,
        onSurface: textPrimary,
      ),
      scaffoldBackgroundColor: background,
      appBarTheme: const AppBarTheme(
        backgroundColor: primary,
        foregroundColor: textOnPrimary,
        elevation: 0,
        centerTitle: true,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: textOnPrimary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        ),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          color: textPrimary,
          fontWeight: FontWeight.bold,
        ),
        headlineMedium: TextStyle(
          color: textPrimary,
          fontWeight: FontWeight.w600,
        ),
        bodyLarge: TextStyle(color: textPrimary),
        bodyMedium: TextStyle(color: textSecondary),
      ),
    );
  }
}
