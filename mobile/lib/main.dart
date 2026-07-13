import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/theme.dart';
import 'screens/splash/splash_screen.dart';
import 'providers/auth_provider.dart';
import 'services/api_service.dart';

/// Global navigator key — used by ApiService 401 interceptor to force-login.
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() {
  // Wire 401 interceptor to navigate back to login from anywhere.
  onAuth401 = () {
    final ctx = navigatorKey.currentContext;
    if (ctx != null) {
      Provider.of<AuthProvider>(ctx, listen: false).logout();
      Navigator.of(ctx).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const SplashScreen()),
        (_) => false,
      );
    }
  };

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
      navigatorKey: navigatorKey,
      home: const SplashScreen(),
    );
  }
}
