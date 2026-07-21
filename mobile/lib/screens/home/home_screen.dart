import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../main_shell.dart';
import 'widgets/banner_carousel.dart';
import '../../services/api_service.dart';
import '../scan/scan_result_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _api = ApiService();
  bool _showLast7Days = true;

  int _totalScans = 0;
  int _healthPercentage = 0;
  int _totalWorkspaces = 0;
  List<dynamic> _recentScans = [];
  
  int _sehatCount = 0;
  int _terdeteksiCount = 0;
  int _hamaCount = 0;
  bool _isLoadingData = true;

  static const double _sectionTitleFontSize = 16;

  @override
  void initState() {
    super.initState();
    _loadHomeData();
  }

  Future<void> _loadHomeData() async {
    if (!mounted) return;
    setState(() => _isLoadingData = true);
    
    try {
      final futures = await Future.wait([
        _api.getScanStats(),
        _api.getMyWorkspaces(),
        _api.getScanHistory(limit: 3),
      ]);
      
      final statsRes = futures[0];
      final workspaceRes = futures[1];
      final historyRes = futures[2];
      
      if (statsRes.statusCode == 200 && statsRes.data['success'] == true) {
        final data = statsRes.data['data'];
        _totalScans = data['totalScans'] ?? 0;
        _healthPercentage = data['healthPercentage'] ?? 0;
        
        final chartData = data['chartData'] as List<dynamic>? ?? [];
        _sehatCount = 0;
        _terdeteksiCount = 0;
        _hamaCount = 0;
        for (var item in chartData) {
          if (item['label'] == 'Sehat') _sehatCount = item['value'] ?? 0;
          if (item['label'] == 'Penyakit') _terdeteksiCount = item['value'] ?? 0;
          if (item['label'] == 'Hama') _hamaCount = item['value'] ?? 0;
        }
      }
      
      if (workspaceRes.statusCode == 200 && workspaceRes.data['success'] == true) {
        final data = workspaceRes.data['data'] as List<dynamic>? ?? [];
        _totalWorkspaces = data.length;
      }
      
      if (historyRes.statusCode == 200 && historyRes.data['success'] == true) {
        _recentScans = historyRes.data['data'] ?? [];
      }
    } catch (e) {
      debugPrint('Error loading home data: $e');
    } finally {
      if (mounted) setState(() => _isLoadingData = false);
    }
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }

  void _navigateToRiwayat() {
    final shellState = context.findAncestorStateOfType<MainShellState>();
    shellState?.switchTab(3);
  }

  void _openDetail(Map<String, dynamic> scan) {
    final disease = scan['disease'] as Map<String, dynamic>?;
    final diag = (scan['diagnosisResult'] ?? '').toString().toLowerCase();
    final isHealthy = diag.contains('sehat') || diag.contains('normal');

    final String aiCategory;
    if (isHealthy) {
      aiCategory = 'Sehat';
    } else if (disease?['jenis'] != null) {
      aiCategory = disease!['jenis'] as String; // 'Penyakit' atau 'Hama'
    } else {
      aiCategory = 'Penyakit'; // default
    }
    
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ScanResultScreen(
          imageUrl: scan['imageUrl'],
          validationStatus: scan['validationStatus'] ?? 'Tidak Diketahui',
          message: 'Detail Riwayat Pindaian',
          aiDiagnosis: {
            'isHealthy': isHealthy,
            'diagnosisResult': scan['diagnosisResult'] ?? (disease?['nama'] ?? 'Tidak Diketahui'),
            'category': aiCategory,
            'probability': scan['probability'] ?? 0,
            'recommendation': disease?['penanganan'] ?? (isHealthy ? 'Tanaman dalam kondisi baik.' : 'Tidak ada rekomendasi/SOP khusus.'),
            'description': 'Dipindai pada lokasi lahan: ${scan['workspace']?['name'] ?? 'Tidak diketahui'}',
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: SafeArea(
        top: false,
        child: RefreshIndicator(
          onRefresh: () async {
            await Provider.of<AuthProvider>(context, listen: false).fetchProfile();
            await _loadHomeData();
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildGreenHeader(),
                const SizedBox(height: 24),
                const BannerCarousel(),
                const SizedBox(height: 24),
                _isLoadingData 
                    ? const Padding(padding: EdgeInsets.all(20), child: Center(child: CircularProgressIndicator()))
                    : _buildStatisticsSection(),
                const SizedBox(height: 24),
                if (!_isLoadingData) _buildHealthTrendSection(),
                if (!_isLoadingData) const SizedBox(height: 24),
                if (!_isLoadingData) _buildRecentScansSection(),
                const SizedBox(height: 100),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGreenHeader() {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        final user = auth.user;
        final name = user?['name'] ?? 'Pengguna';

        return Container(
          width: double.infinity,
          padding: EdgeInsets.fromLTRB(
            24,
            MediaQuery.of(context).padding.top + 12,
            24,
            30,
          ),
          decoration: const BoxDecoration(
            color: Color(0xFF1B5E20),
            borderRadius: BorderRadius.only(
              bottomLeft: Radius.circular(32),
              bottomRight: Radius.circular(32),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'KARU',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.5,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF42C9A0).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.location_on, color: Colors.redAccent, size: 14),
                        SizedBox(width: 4),
                        Text(
                          'Subang, Jawa Barat',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundColor: const Color(0xFF42C9A0).withOpacity(0.2),
                    backgroundImage: user?['image'] != null
                        ? NetworkImage(user!['image'])
                        : null,
                    child: user?['image'] == null
                        ? const Icon(Icons.person, color: Colors.white, size: 28)
                        : null,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Halo, ${_getGreeting().toLowerCase()}',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.7),
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: const Color(0xFF42C9A0).withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.notifications_outlined,
                      color: Colors.white,
                      size: 22,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatisticsSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Statistik Data',
            style: TextStyle(
              fontSize: _sectionTitleFontSize,
              fontWeight: FontWeight.bold,
              color: Color(0xFF040D0B),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _buildCompactStatCard(
                  accentColor: const Color(0xFFC8A951),
                  iconBgColor: const Color(0xFFFFF8E1),
                  icon: Icons.eco_rounded,
                  value: '$_totalScans',
                  label: 'Total Scan',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildCompactStatCard(
                  accentColor: const Color(0xFF1976D2),
                  iconBgColor: const Color(0xFFE3F2FD),
                  icon: Icons.monitor_heart_outlined,
                  value: '$_healthPercentage%',
                  label: 'Kesehatan',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildCompactStatCard(
                  accentColor: const Color(0xFFC2185B),
                  iconBgColor: const Color(0xFFFCE4EC),
                  icon: Icons.landscape_rounded,
                  value: '$_totalWorkspaces',
                  label: 'Total Lahan',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCompactStatCard({
    required Color accentColor,
    required Color iconBgColor,
    required IconData icon,
    required String value,
    required String label,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 3,
            height: 32,
            decoration: BoxDecoration(
              color: accentColor,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 6),
          Container(
            padding: const EdgeInsets.all(5),
            decoration: BoxDecoration(
              color: iconBgColor,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: accentColor, size: 16),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: accentColor,
                  ),
                ),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 9,
                    color: Colors.grey[500],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHealthTrendSection() {
    int total = _sehatCount + _terdeteksiCount + _hamaCount;
    double sehatVal = total == 0 ? 0 : _sehatCount / total;
    double penyakitVal = total == 0 ? 0 : _terdeteksiCount / total;
    double hamaVal = total == 0 ? 0 : _hamaCount / total;
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Tren Kesehatan AI',
                  style: TextStyle(
                    fontSize: _sectionTitleFontSize,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF040D0B),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: const Color(0xFF42C9A0).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      _buildToggleChip(label: 'Semua', isActive: _showLast7Days, onTap: () {
                        setState(() => _showLast7Days = true);
                      }),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            if (total == 0)
              const Center(child: Text("Belum ada data pindaian", style: TextStyle(color: Colors.grey))),
            if (total > 0) ...[
              _buildProgressBar(label: 'Sehat', count: _sehatCount, value: sehatVal, color: const Color(0xFF2E7D32)),
              const SizedBox(height: 18),
              _buildProgressBar(label: 'Penyakit', count: _terdeteksiCount, value: penyakitVal, color: const Color(0xFF8B1A1A)),
              const SizedBox(height: 18),
              _buildProgressBar(label: 'Hama', count: _hamaCount, value: hamaVal, color: const Color(0xFFE65100)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildToggleChip({
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFF040D0B) : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isActive ? Colors.white : const Color(0xFF9E9E9E),
          ),
        ),
      ),
    );
  }

  Widget _buildProgressBar({
    required String label,
    required double value,
    required Color color,
    int count = 0,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: Colors.grey[700],
              ),
            ),
            Row(
              children: [
                Text(
                  '$count scan',
                  style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                ),
                const SizedBox(width: 8),
                Text(
                  '${(value * 100).toInt()}%',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 8),
        Stack(
          children: [
            Container(
              width: double.infinity,
              height: 14,
              decoration: BoxDecoration(
                color: const Color(0xFFEEEEEE),
                borderRadius: BorderRadius.circular(7),
              ),
            ),
            AnimatedContainer(
              duration: const Duration(milliseconds: 600),
              curve: Curves.easeInOut,
              width: MediaQuery.of(context).size.width * value,
              height: 14,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(7),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRecentScansSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Pindaian Terbaru',
                style: TextStyle(
                  fontSize: _sectionTitleFontSize,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF040D0B),
                ),
              ),
              TextButton(
                onPressed: _navigateToRiwayat,
                style: TextButton.styleFrom(padding: EdgeInsets.zero),
                child: const Text(
                  'Lihat Semua',
                  style: TextStyle(
                    color: Color(0xFF1976D2),
                    fontSize: 13,
                    decoration: TextDecoration.underline,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.grey.withOpacity(0.15)),
            ),
            child: _recentScans.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(20.0),
                    child: Center(
                      child: Text('Belum ada riwayat pindaian.', style: TextStyle(color: Colors.grey)),
                    ),
                  )
                : Column(
                    children: _recentScans.map((scan) {
                      final diag = (scan['diagnosisResult'] ?? '').toString().toLowerCase();
                      final isHealthy = diag.contains('sehat') || diag.contains('normal');
                      final title = scan['diagnosisResult'] ?? 'Tidak Diketahui';
                      
                      final category = scan['disease']?['kategori'];
                      final subtitle = isHealthy ? 'Sehat' : (category ?? 'Terdeteksi');
                      
                      final subtitleColor = isHealthy ? const Color(0xFF2E7D32) : const Color(0xFFC62828);
                      
                      return Column(
                        children: [
                          _buildScanItem(
                            title: title,
                            subtitle: subtitle,
                            subtitleColor: subtitleColor,
                            scan: scan,
                          ),
                          if (scan != _recentScans.last) Divider(height: 1, color: Colors.grey[200]),
                        ],
                      );
                    }).toList(),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildScanItem({
    required String title,
    required String subtitle,
    required Color subtitleColor,
    required Map<String, dynamic> scan,
  }) {
    return InkWell(
      onTap: () => _openDetail(scan),
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFFFFF8E1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.eco_rounded, color: Color(0xFFC8A951), size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: Color(0xFF212121),
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: subtitleColor,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.grey[400], size: 22),
          ],
        ),
      ),
    );
  }
}
