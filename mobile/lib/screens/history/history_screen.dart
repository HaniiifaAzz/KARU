import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';
import 'package:intl/intl.dart';
import '../scan/scan_result_screen.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final ApiService _api = ApiService();
  List<dynamic> _scans = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await _api.getScanHistory();
      if (res.statusCode == 200 && res.data['success'] == true) {
        setState(() {
          _scans = res.data['data'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() { _error = 'Gagal memuat riwayat.'; _isLoading = false; });
      }
    } catch (e) {
      setState(() { _error = 'Tidak dapat terhubung ke server.'; _isLoading = false; });
    }
  }
  
  String _formatDate(String? dateString) {
    if (dateString == null) return '-';
    try {
      final date = DateTime.parse(dateString).toLocal();
      return DateFormat('dd MMM yyyy, HH:mm').format(date);
    } catch (e) {
      return dateString;
    }
  }

  void _openDetail(Map<String, dynamic> scan) {
    final disease = scan['disease'] as Map<String, dynamic>?;
    
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ScanResultScreen(
          imageUrl: scan['imageUrl'],
          validationStatus: scan['validationStatus'] ?? 'Tidak Diketahui',
          message: 'Detail Riwayat Pindaian',
          aiDiagnosis: {
            'isHealthy': (disease == null || disease.isEmpty),
            'diagnosisResult': scan['diagnosisResult'] ?? (disease?['nama'] ?? 'Tidak Diketahui'),
            'category': disease?['kategori'] ?? 'Terdeteksi',
            'probability': scan['probability'] ?? 0,
            'recommendation': disease?['penanganan'] ?? 'Tidak ada rekomendasi/SOP khusus.',
            'description': 'Dipindai pada lokasi lahan: ${scan['workspace']?['name'] ?? 'Tidak diketahui'}',
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KaruTheme.background,
      appBar: AppBar(
        title: const Text('Riwayat Pindaian', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: KaruTheme.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: KaruTheme.error)))
              : _scans.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.history_rounded, size: 64, color: KaruTheme.textSecondary),
                          SizedBox(height: 16),
                          Text('Belum ada riwayat pindaian', style: TextStyle(color: KaruTheme.textSecondary)),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _fetchHistory,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _scans.length,
                        itemBuilder: (context, index) {
                          final scan = _scans[index];
                          final isValid = scan['validationStatus'] == 'Valid';
                          
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 1,
                            child: InkWell(
                              onTap: () => _openDetail(scan),
                              borderRadius: BorderRadius.circular(12),
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(16),
                                leading: Container(
                                  width: 50,
                                  height: 50,
                                  decoration: BoxDecoration(
                                    color: isValid ? Colors.green.withValues(alpha: 0.1) : Colors.orange.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                    image: scan['imageUrl'] != null
                                        ? DecorationImage(
                                            image: NetworkImage(scan['imageUrl']),
                                            fit: BoxFit.cover,
                                            colorFilter: ColorFilter.mode(Colors.black.withValues(alpha: 0.2), BlendMode.darken),
                                          )
                                        : null,
                                  ),
                                  child: scan['imageUrl'] == null 
                                      ? Icon(Icons.eco, color: isValid ? KaruTheme.primary : Colors.orange)
                                      : null,
                                ),
                                title: Text(
                                  scan['diagnosisResult'] ?? '-', 
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 4),
                                    Text(
                                      _formatDate(scan['scannedAt']), 
                                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Icon(
                                          isValid ? Icons.verified : Icons.warning_amber_rounded, 
                                          size: 14, 
                                          color: isValid ? Colors.green : Colors.orange,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          scan['validationStatus'] ?? '-', 
                                          style: TextStyle(
                                            fontSize: 12, 
                                            fontWeight: FontWeight.bold,
                                            color: isValid ? Colors.green : Colors.orange,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}
