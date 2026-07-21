import 'dart:io';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';

class ScanResultScreen extends StatelessWidget {
  final String? localImagePath;
  final String? imageUrl;
  final String validationStatus;
  final String message;
  final Map<String, dynamic>? aiDiagnosis;

  const ScanResultScreen({
    super.key,
    this.localImagePath,
    this.imageUrl,
    required this.validationStatus,
    required this.message,
    this.aiDiagnosis,
  });

  @override
  Widget build(BuildContext context) {
    final bool isHealthy = aiDiagnosis?['isHealthy'] ?? false;
    final String diagnosisResult = aiDiagnosis?['diagnosisResult'] ?? 'Hasil Diagnosa Tidak Tersedia';
    final String category = aiDiagnosis?['category'] ?? 'Sehat';
    final int probability = ((aiDiagnosis?['probability'] ?? 0) as num).toInt();
    final String? namaIlmiah = aiDiagnosis?['namaIlmiah'];
    final String? severity = aiDiagnosis?['severity'];
    final String recommendation = aiDiagnosis?['recommendation'] ?? 'Tidak ada rekomendasi khusus.';
    final String description = aiDiagnosis?['description'] ?? 'Pindaian berhasil diproses.';

    final bool isValidLocation = validationStatus == 'Valid';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF8),
      body: CustomScrollView(
        slivers: [
          // Header Foto Pindaian
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            backgroundColor: KaruTheme.primary,
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  if (localImagePath != null && File(localImagePath!).existsSync())
                    Image.file(
                      File(localImagePath!),
                      fit: BoxFit.cover,
                    )
                  else if (imageUrl != null && imageUrl!.isNotEmpty)
                    CachedNetworkImage(
                      imageUrl: imageUrl!,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        color: Colors.grey[200],
                        child: const Center(child: CircularProgressIndicator()),
                      ),
                      errorWidget: (context, url, error) => Container(
                        color: Colors.grey[300],
                        child: const Icon(Icons.image_not_supported_rounded, size: 50, color: Colors.grey),
                      ),
                    )
                  else
                    Container(
                      color: KaruTheme.primary,
                      child: const Icon(Icons.eco_rounded, size: 80, color: Colors.white54),
                    ),
                  
                  // Gradient Overlay untuk kontras teks
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.4),
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.7),
                        ],
                      ),
                    ),
                  ),

                  // Badge Geofence Validasi di Atas Foto
                  Positioned(
                    bottom: 16,
                    left: 16,
                    right: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: isValidLocation
                            ? const Color(0xFF2E7D32).withValues(alpha: 0.9)
                            : Colors.orange[800]?.withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.2),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isValidLocation ? Icons.verified_rounded : Icons.warning_rounded,
                            color: Colors.white,
                            size: 18,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              isValidLocation
                                  ? 'Lokasi Valid (Di Dalam Poligon Lahan)'
                                  : 'Terdeteksi di Luar Batas Lahan',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Konten Hasil Diagnosis AI
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Card Utama Diagnosa
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 15,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Row Kategori & Severity Badges
                        Row(
                          children: [
                            _buildBadge(
                              label: category,
                              color: isHealthy ? Colors.green : Colors.red,
                              icon: isHealthy ? Icons.check_circle_rounded : Icons.bug_report_rounded,
                            ),
                            if (severity != null) ...[
                              const SizedBox(width: 8),
                              _buildBadge(
                                label: 'Tingkat $severity',
                                color: _getSeverityColor(severity),
                                icon: Icons.error_outline_rounded,
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 14),

                        // Nama Hasil Diagnosis
                        Text(
                          diagnosisResult,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                          ),
                        ),

                        if (namaIlmiah != null && namaIlmiah.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            namaIlmiah,
                            style: const TextStyle(
                              fontSize: 14,
                              fontStyle: FontStyle.italic,
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],

                        const SizedBox(height: 20),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        const SizedBox(height: 16),

                        // Progress / Gauge Confidence AI
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.auto_awesome_rounded, size: 18, color: KaruTheme.primary),
                                const SizedBox(width: 6),
                                const Text(
                                  'Tingkat Keyakinan AI',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF475569),
                                  ),
                                ),
                              ],
                            ),
                            Text(
                              '$probability%',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: _getProbabilityColor(probability),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: LinearProgressIndicator(
                            value: probability / 100.0,
                            minHeight: 8,
                            backgroundColor: const Color(0xFFF1F5F9),
                            valueColor: AlwaysStoppedAnimation<Color>(_getProbabilityColor(probability)),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Card Penjelasan Detail
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 15,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.notes_rounded, size: 20, color: Color(0xFF334155)),
                            SizedBox(width: 8),
                            Text(
                              'Deskripsi Temuan',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1E293B),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          description,
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF475569),
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Card Rekomendasi Penanganan
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFBFDBFE)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.lightbulb_rounded, size: 22, color: Color(0xFF2563EB)),
                            SizedBox(width: 8),
                            Text(
                              'Rekomendasi Penanganan AI',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1E3A8A),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          recommendation,
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF1E40AF),
                            height: 1.5,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Tombol Tindakan
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.of(context).pop();
                      },
                      icon: const Icon(Icons.camera_alt_rounded, color: Colors.white),
                      label: const Text(
                        'Pindai Daun Lain',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: KaruTheme.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 2,
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.of(context).popUntil((route) => route.isFirst);
                      },
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: KaruTheme.primary, width: 1.5),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: Text(
                        'Kembali ke Beranda',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: KaruTheme.primary,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBadge({required String label, required Color color, required IconData icon}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Color _getSeverityColor(String severity) {
    switch (severity.toLowerCase()) {
      case 'ringan':
        return Colors.green[700]!;
      case 'sedang':
        return Colors.orange[800]!;
      case 'berat':
        return Colors.red[700]!;
      default:
        return Colors.blue[700]!;
    }
  }

  Color _getProbabilityColor(int probability) {
    if (probability >= 80) return const Color(0xFF16A34A);
    if (probability >= 50) return const Color(0xFFD97706);
    return const Color(0xFFDC2626);
  }
}
