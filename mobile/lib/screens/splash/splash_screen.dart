import 'package:flutter/material.dart';
import '../../config/theme.dart';
// import '../auth/login_screen.dart'; // Nanti

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
    // Simulasi loading 2 detik
    await Future.delayed(const Duration(seconds: 2));
    
    // Nanti akan diisi logika cek token
    // if (!mounted) return;
    // Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
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
