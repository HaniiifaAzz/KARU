import 'package:flutter/material.dart';
import '../config/theme.dart';
import 'home/home_screen.dart';
import 'workspace/workspace_list_screen.dart';
import 'history/history_screen.dart';
import 'profile/profile_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),
    const WorkspaceListScreen(),
    const SizedBox.shrink(), // FAB placeholder for Scan
    const HistoryScreen(),
    const ProfileScreen(),
  ];

  void _onTabTapped(int index) {
    if (index == 2) {
      // FAB ditangani terpisah
      return;
    }
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Buka CameraScreen
          // Navigator.push(context, MaterialPageRoute(builder: (_) => const CameraScreen()));
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Buka Kamera AI...')),
          );
        },
        backgroundColor: KaruTheme.primary,
        elevation: 4,
        shape: const CircleBorder(),
        child: const Icon(Icons.document_scanner_rounded, color: Colors.white, size: 28),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        shape: const CircularNotchedRectangle(),
        notchMargin: 8,
        color: KaruTheme.surface,
        elevation: 10,
        child: SizedBox(
          height: 60,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(icon: Icons.home_rounded, label: 'Beranda', index: 0),
              _buildNavItem(icon: Icons.map_rounded, label: 'Lahan', index: 1),
              const SizedBox(width: 48), // Space for FAB
              _buildNavItem(icon: Icons.history_rounded, label: 'Riwayat', index: 3),
              _buildNavItem(icon: Icons.person_rounded, label: 'Profil', index: 4),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({required IconData icon, required String label, required int index}) {
    final isSelected = _currentIndex == index;
    return InkWell(
      onTap: () => _onTabTapped(index),
      splashColor: Colors.transparent,
      highlightColor: Colors.transparent,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            color: isSelected ? KaruTheme.primary : KaruTheme.textSecondary.withOpacity(0.5),
            size: 24,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              color: isSelected ? KaruTheme.primary : KaruTheme.textSecondary.withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }
}
