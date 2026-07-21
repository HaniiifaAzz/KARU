import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:dio/dio.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';
import 'scan_result_screen.dart';

class ScanLeafScreen extends StatefulWidget {
  final String? initialWorkspaceId;
  final String? initialWorkspaceName;

  const ScanLeafScreen({
    super.key,
    this.initialWorkspaceId,
    this.initialWorkspaceName,
  });

  @override
  State<ScanLeafScreen> createState() => _ScanLeafScreenState();
}

class _ScanLeafScreenState extends State<ScanLeafScreen> {
  final ApiService _api = ApiService();
  final ImagePicker _picker = ImagePicker();

  XFile? _selectedImage;
  Position? _currentPosition;
  bool _isLoadingLocation = true;
  bool _isAnalyzing = false;
  String _analysisStatus = '';

  List<dynamic> _workspaces = [];
  String? _selectedWorkspaceId;
  String? _selectedWorkspaceName;
  bool _isLoadingWorkspaces = true;

  @override
  void initState() {
    super.initState();
    _selectedWorkspaceId = widget.initialWorkspaceId;
    _selectedWorkspaceName = widget.initialWorkspaceName;
    _fetchWorkspaces();
    _getGPSLocation();
  }

  Future<void> _fetchWorkspaces() async {
    try {
      final res = await _api.getMyWorkspaces();
      if (res.statusCode == 200 && res.data['success'] == true) {
        final List<dynamic> list = res.data['data'] ?? [];
        setState(() {
          _workspaces = list;
          if (_selectedWorkspaceId == null && list.isNotEmpty) {
            _selectedWorkspaceId = list[0]['id']?.toString();
            _selectedWorkspaceName = list[0]['name']?.toString();
          }
        });
      }
    } catch (e) {
      debugPrint('Error fetching workspaces: $e');
    } finally {
      setState(() {
        _isLoadingWorkspaces = false;
      });
    }
  }

  Future<void> _getGPSLocation() async {
    setState(() {
      _isLoadingLocation = true;
    });

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Layanan lokasi (GPS) tidak aktif.');
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Izin akses lokasi ditolak.');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception('Izin akses lokasi ditolak secara permanen di Pengaturan HP.');
      }

      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
    } catch (e) {
      debugPrint('Location Error: $e');
    } finally {
      setState(() {
        _isLoadingLocation = false;
      });
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        maxWidth: 1280,
        maxHeight: 1280,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          _selectedImage = image;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal mengambil gambar: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _submitScan() async {
    if (_selectedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih atau ambil foto daun terlebih dahulu.')),
      );
      return;
    }

    if (_selectedWorkspaceId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih Lahan / Workspace terlebih dahulu.')),
      );
      return;
    }

    if (_currentPosition == null) {
      await _getGPSLocation();
      if (_currentPosition == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Lokasi GPS tidak ditemukan. Pastikan GPS aktif.')),
        );
        return;
      }
    }

    setState(() {
      _isAnalyzing = true;
      _analysisStatus = 'Mengunggah foto daun ke server...';
    });

    try {
      // 1. Upload File Foto
      final uploadRes = await _api.uploadFile(_selectedImage!.path);
      if (uploadRes.statusCode != 200 && uploadRes.statusCode != 201) {
        throw Exception(uploadRes.data['error'] ?? 'Gagal mengunggah foto daun.');
      }

      final String imageUrl = uploadRes.data['imageUrl'];

      setState(() {
        _analysisStatus = 'Menjalankan AI Gemini Diagnosa...';
      });

      // 2. Submit Pindaian & Jalankan Diagnosa Gemini AI
      final scanRes = await _api.submitScan(
        latitude: _currentPosition!.latitude,
        longitude: _currentPosition!.longitude,
        workspaceId: _selectedWorkspaceId,
        imageUrl: imageUrl,
      );

      if (scanRes.statusCode == 200 || scanRes.statusCode == 201) {
        final data = scanRes.data;
        if (data['success'] == true) {
          if (!mounted) return;

          // Pindah ke Halaman Hasil Diagnosis AI
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => ScanResultScreen(
                localImagePath: _selectedImage!.path,
                imageUrl: imageUrl,
                validationStatus: data['validationStatus'] ?? 'Valid',
                message: data['message'] ?? '',
                aiDiagnosis: data['aiDiagnosis'],
              ),
            ),
          );
        } else {
          throw Exception(data['error'] ?? 'Gagal memproses pindaian.');
        }
      } else {
        throw Exception(scanRes.data['error'] ?? 'Gagal memproses pindaian.');
      }

    } catch (e) {
      debugPrint('Scan Submission Error: $e');
      String errorMessage = e.toString().replaceAll('Exception:', '');
      if (e is DioException && e.response?.data != null) {
        final data = e.response?.data;
        if (data is Map && (data['error'] != null || data['message'] != null)) {
          errorMessage = data['error'] ?? data['message'];
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $errorMessage'),
            backgroundColor: Colors.red[700],
            duration: const Duration(seconds: 6),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isAnalyzing = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF8),
      appBar: AppBar(
        title: const Text(
          'Diagnosa Daun & AI',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: KaruTheme.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Card Pemilihan Workspace Lahan
                _buildWorkspaceSelector(),

                const SizedBox(height: 16),

                // Card GPS Location Status
                _buildGPSStatusCard(),

                const SizedBox(height: 20),

                // Area Pratinjau Foto atau Tombol Ambil Gambar
                _buildImagePreviewArea(),

                const SizedBox(height: 24),

                // Tombol Eksekusi AI Diagnosis
                if (_selectedImage != null)
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton.icon(
                      onPressed: _isAnalyzing ? null : _submitScan,
                      icon: const Icon(Icons.auto_awesome_rounded, color: Colors.white),
                      label: const Text(
                        'Jalankan Diagnosa AI Gemini',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: KaruTheme.primary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 3,
                      ),
                    ),
                  ),

                const SizedBox(height: 20),
              ],
            ),
          ),

          // Loading Modal Overlay saat AI sedang Menganalisis
          if (_isAnalyzing)
            Container(
              color: Colors.black.withValues(alpha: 0.7),
              child: Center(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 40),
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: KaruTheme.primary.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const CircularProgressIndicator(
                          color: KaruTheme.primary,
                          strokeWidth: 3,
                        ),
                      ),
                      const SizedBox(height: 20),
                      const Text(
                        'Kecerdasan Buatan (AI)',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _analysisStatus,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildWorkspaceSelector() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.landscape_rounded, color: KaruTheme.primary, size: 20),
              SizedBox(width: 8),
              Text(
                'Lokasi Lahan (Workspace)',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _isLoadingWorkspaces
              ? const SizedBox(
                  height: 48,
                  child: Center(
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                )
              : Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAF8),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedWorkspaceId,
                      isExpanded: true,
                      hint: const Text('Pilih Lahan...'),
                      icon: const Icon(Icons.arrow_drop_down_rounded, color: Color(0xFF64748B)),
                      items: _workspaces.map((ws) {
                        return DropdownMenuItem<String>(
                          value: ws['id'].toString(),
                          child: Text(
                            ws['name']?.toString() ?? 'Lahan',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF334155),
                            ),
                          ),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          final selected = _workspaces.firstWhere((w) => w['id'].toString() == val, orElse: () => null);
                          setState(() {
                            _selectedWorkspaceId = val;
                            _selectedWorkspaceName = selected?['name'];
                          });
                        }
                      },
                    ),
                  ),
                ),
        ],
      ),
    );
  }

  Widget _buildGPSStatusCard() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: _currentPosition != null
            ? const Color(0xFFF0FDF4)
            : const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: _currentPosition != null
              ? const Color(0xFFBBF7D0)
              : const Color(0xFFFDE68A),
        ),
      ),
      child: Row(
        children: [
          Icon(
            _currentPosition != null ? Icons.my_location_rounded : Icons.location_searching_rounded,
            color: _currentPosition != null ? const Color(0xFF16A34A) : const Color(0xFFD97706),
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _currentPosition != null ? 'Koordinat GPS Terdeteksi' : 'Mencari Lokasi GPS...',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: _currentPosition != null ? const Color(0xFF15803D) : const Color(0xFFB45309),
                  ),
                ),
                if (_currentPosition != null)
                  Text(
                    '${_currentPosition!.latitude.toStringAsFixed(5)}, ${_currentPosition!.longitude.toStringAsFixed(5)}',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF475569)),
                  ),
              ],
            ),
          ),
          IconButton(
            onPressed: _getGPSLocation,
            icon: const Icon(Icons.refresh_rounded, size: 18),
            color: const Color(0xFF475569),
            tooltip: 'Perbarui GPS',
          ),
        ],
      ),
    );
  }

  Widget _buildImagePreviewArea() {
    if (_selectedImage != null) {
      return Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 15,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              child: SizedBox(
                height: 280,
                width: double.infinity,
                child: Image.file(
                  File(_selectedImage!.path),
                  fit: BoxFit.cover,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14.0),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickImage(ImageSource.camera),
                      icon: const Icon(Icons.camera_alt_rounded, size: 18),
                      label: const Text('Foto Ulang', style: TextStyle(fontSize: 13)),
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickImage(ImageSource.gallery),
                      icon: const Icon(Icons.photo_library_rounded, size: 18),
                      label: const Text('Galeri', style: TextStyle(fontSize: 13)),
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: KaruTheme.primary.withValues(alpha: 0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.center_focus_strong_rounded,
              size: 48,
              color: KaruTheme.primary,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Ambil Foto Daun Tanaman',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Pastikan daun terlihat jelas dan terang agar diagnosa AI Gemini memberikan hasil terbaik.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              color: Color(0xFF64748B),
              height: 1.4,
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _pickImage(ImageSource.camera),
                  icon: const Icon(Icons.camera_alt_rounded, color: Colors.white),
                  label: const Text('Buka Kamera', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: KaruTheme.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _pickImage(ImageSource.gallery),
                  icon: const Icon(Icons.photo_library_rounded, color: KaruTheme.primary),
                  label: const Text('Dari Galeri', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: KaruTheme.primary, width: 1.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
