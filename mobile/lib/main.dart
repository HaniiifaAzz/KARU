import 'package:flutter/material.dart';
import 'config/theme.dart';
import 'screens/splash/splash_screen.dart';
// import 'package:provider/provider.dart'; // Nanti ditambahkan provider

void main() {
  runApp(const KaruApp());
}

class KaruApp extends StatelessWidget {
  const KaruApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KARU',
      debugShowCheckedModeBanner: false,
      theme: KaruTheme.lightTheme,
      home: const SplashScreen(),
    );
  }
}
