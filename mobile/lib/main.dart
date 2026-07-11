import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/theme.dart';
import 'screens/splash/splash_screen.dart';
import 'providers/auth_provider.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: const KaruApp(),
    ),
  );
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
