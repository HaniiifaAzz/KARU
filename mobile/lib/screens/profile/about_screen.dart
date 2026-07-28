import 'package:flutter/material.dart';
import '../../config/theme.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KaruTheme.background,
      appBar: AppBar(
        title: const Text('Tentang Aplikasi'),
        backgroundColor: Colors.white,
        foregroundColor: KaruTheme.textPrimary,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 40),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Image.asset(
                'assets/images/logo.png', // Fallback to icon if logo doesn't exist
                height: 80,
                width: 80,
                errorBuilder: (context, error, stackTrace) {
                  return const Icon(
                    Icons.eco,
                    size: 80,
                    color: KaruTheme.primary,
                  );
                },
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'KARU',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: KaruTheme.primary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Versi 1.0.0',
              style: TextStyle(
                fontSize: 16,
                color: KaruTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 40),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Deskripsi',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: KaruTheme.textPrimary,
                    ),
                  ),
                  SizedBox(height: 12),
                  Text(
                    'KARU (Your Intelligent Green Eye) adalah sistem pemantauan ekologi yang dilengkapi dengan diagnosis penyakit tanaman berbasis AI. Aplikasi ini dirancang untuk memudahkan manajemen pertanian, pemantauan kesehatan tanaman, dan memberikan wawasan cerdas dalam menjaga ekosistem pertanian secara berkelanjutan.',
                    style: TextStyle(
                      fontSize: 14,
                      color: KaruTheme.textSecondary,
                      height: 1.6,
                    ),
                  ),
                  SizedBox(height: 24),
                  Text(
                    'Hak Cipta',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: KaruTheme.textPrimary,
                    ),
                  ),
                  SizedBox(height: 12),
                  Text(
                    '© 2026 KARU Team. Hak cipta dilindungi undang-undang.',
                    style: TextStyle(
                      fontSize: 14,
                      color: KaruTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
