import 'package:flutter/material.dart';
import '../../config/theme.dart';

class FaqScreen extends StatelessWidget {
  const FaqScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KaruTheme.background,
      appBar: AppBar(
        title: const Text('Bantuan / FAQ'),
        backgroundColor: Colors.white,
        foregroundColor: KaruTheme.textPrimary,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: const [
          _FaqItem(
            question: 'Bagaimana cara menambahkan scan baru?',
            answer: 'Tekan tombol + pada halaman Scan, pilih foto atau ambil foto baru, kemudian isi detail dan kirim.',
          ),
          _FaqItem(
            question: 'Saya lupa password, apa yang harus saya lakukan?',
            answer: 'Saat ini belum ada fitur reset password, hubungi admin untuk mengubah password secara manual.',
          ),
          _FaqItem(
            question: 'Bagaimana cara logout dari aplikasi?',
            answer: 'Buka Profil → Logout. Aplikasi akan menghapus token dan kembali ke layar login.',
          ),
          _FaqItem(
            question: 'Apakah data saya disimpan secara lokal?',
            answer: 'Data utama (scan, profil) disimpan di server Supabase. Token disimpan di secure storage pada perangkat.',
          ),
        ],
      ),
    );
  }
}

class _FaqItem extends StatelessWidget {
  final String question;
  final String answer;

  const _FaqItem({required this.question, required this.answer});

  @override
  Widget build(BuildContext context) {
    return ExpansionTile(
      title: Text(question, style: TextStyle(color: KaruTheme.textPrimary, fontWeight: FontWeight.w600)),
      children: [
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(answer, style: TextStyle(color: KaruTheme.textSecondary)),
        ),
      ],
    );
  }
}
