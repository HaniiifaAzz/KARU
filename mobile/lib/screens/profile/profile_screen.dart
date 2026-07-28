import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../screens/splash/splash_screen.dart';
import 'edit_profile_screen.dart';
import 'change_password_screen.dart';
import 'about_screen.dart';
import 'faq_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KaruTheme.background,
      body: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          final user = auth.user;
          final name = user?['name'] ?? 'Pengguna';
          final email = user?['email'] ?? '-';
          final role = user?['role'] == 'admin' ? 'Admin' : 'Operator';
          final stats = user?['stats'];
          final level = stats?['level'] ?? 'Pemula';
          final totalScans = stats?['totalScans'] ?? 0;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const SizedBox(height: 32),
                _buildAvatar(name, user?['image']),
                const SizedBox(height: 16),
                Text(name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(role, style: const TextStyle(fontSize: 14, color: KaruTheme.textSecondary)),
                const SizedBox(height: 4),
                Text(email, style: const TextStyle(fontSize: 13, color: KaruTheme.textSecondary)),
                const SizedBox(height: 24),
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _statItem(Icons.star, level, 'Level'),
                        _statItem(Icons.qr_code_scanner, '$totalScans', 'Total Scan'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                // ── Sub‑menu ────────────────────────
                ListTile(
                  leading: const Icon(Icons.edit, color: KaruTheme.primary),
                  title: const Text('Edit Profil'),
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => EditProfileScreen())),
                ),
                ListTile(
                  leading: const Icon(Icons.lock, color: KaruTheme.primary),
                  title: const Text('Ganti Password'),
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ChangePasswordScreen())),
                ),
                ListTile(
                  leading: const Icon(Icons.info, color: KaruTheme.primary),
                  title: const Text('Tentang Aplikasi'),
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => AboutScreen())),
                ),
                ListTile(
                  leading: const Icon(Icons.help, color: KaruTheme.primary),
                  title: const Text('Bantuan / FAQ'),
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => FaqScreen())),
                ),
                const SizedBox(height: 24),
                ListTile(
                  leading: const Icon(Icons.logout, color: KaruTheme.error),
                  title: const Text('Logout', style: TextStyle(color: KaruTheme.error)),
                  onTap: () async {
                    final confirmed = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Logout'),
                        content: const Text('Yakin ingin keluar dari akun?'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
                          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Keluar', style: TextStyle(color: KaruTheme.error))),
                        ],
                      ),
                    );
                    if (confirmed == true) {
                      await auth.logout();
                      if (!context.mounted) return;
                      Navigator.of(context).pushAndRemoveUntil(
                        MaterialPageRoute(builder: (_) => const SplashScreen()),
                        (_) => false,
                      );
                    }
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _statItem(IconData icon, String value, String label) {
    return Column(
      children: [
        Icon(icon, color: KaruTheme.primary, size: 28),
        const SizedBox(height: 8),
        Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 12, color: KaruTheme.textSecondary)),
      ],
    );
  }

  Widget _buildAvatar(String name, String? imageUrl) {
    final hasImage = imageUrl != null && imageUrl.isNotEmpty;
    return Container(
      width: 96,
      height: 96,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: KaruTheme.primaryLight.withAlpha(50),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(20),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipOval(
        child: hasImage
            ? Image.network(
                imageUrl,
                fit: BoxFit.cover,
                width: 96,
                height: 96,
                errorBuilder: (_, __, ___) => _avatarInitials(name),
                loadingBuilder: (_, child, progress) =>
                    progress == null ? child : _avatarInitials(name),
              )
            : _avatarInitials(name),
      ),
    );
  }

  Widget _avatarInitials(String name) {
    return Container(
      color: KaruTheme.primaryLight.withAlpha(50),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : 'U',
          style: const TextStyle(
            fontSize: 36,
            fontWeight: FontWeight.bold,
            color: KaruTheme.primary,
          ),
        ),
      ),
    );
  }
}
