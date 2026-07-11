import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../auth/login_screen.dart';
import '../main_shell.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuthAndNavigate();
  }

  Future<void> _checkAuthAndNavigate() async {
    // Tahan splash screen selama 2 detik untuk branding
    await Future.delayed(const Duration(seconds: 2));
    
    if (!mounted) return;
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final isAuthenticated = await authProvider.checkAuth();
    
    if (!mounted) return;

    if (isAuthenticated) {
      // Ambil profile sekalian sebelum masuk
      await authProvider.fetchProfile();
      
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const MainShell()),
      );
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KaruTheme.splashBackground,
      body: Center(
        child: Image.asset(
          'assets/logo-karu.png',
          width: MediaQuery.of(context).size.width * 0.8,
          fit: BoxFit.contain,
        ),
      ),
    );
  }
}
