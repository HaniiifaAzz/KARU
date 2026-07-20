import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import 'package:geolocator/geolocator.dart';
import 'package:dio/dio.dart';
import '../../config/api_config.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';
import 'workspace_map_screen.dart';

// ── Konstanta lokal ────────────────────────────────────────────────────
const _kAccentGreen = Color(0xFF42C9A0);
const _kPageBg = Color(0xFFF0F2F1);

// ══════════════════════════════════════════════════════════════════════
// Model cuaca Open-Meteo (tanpa API key)
// ══════════════════════════════════════════════════════════════════════
class _WeatherData {
  final double temperature;
  final int weatherCode;
  final double windspeed;
  final String cityName;

  const _WeatherData({
    required this.temperature,
    required this.weatherCode,
    required this.windspeed,
    required this.cityName,
  });

  String get condition {
    if (weatherCode == 0) return 'Cerah';
    if (weatherCode <= 3) return 'Berawan';
    if (weatherCode <= 49) return 'Berkabut';
    if (weatherCode <= 59) return 'Gerimis';
    if (weatherCode <= 69) return 'Hujan';
    if (weatherCode <= 79) return 'Salju';
    if (weatherCode <= 84) return 'Hujan Deras';
    return 'Badai';
  }

  IconData get icon {
    if (weatherCode == 0) return Icons.wb_sunny_rounded;
    if (weatherCode <= 3) return Icons.cloud_rounded;
    if (weatherCode <= 49) return Icons.foggy;
    if (weatherCode <= 69) return Icons.grain_rounded;
    if (weatherCode <= 79) return Icons.ac_unit_rounded;
    return Icons.thunderstorm_rounded;
  }

  Color get iconColor {
    if (weatherCode == 0) return const Color(0xFFFDD835);
    if (weatherCode <= 3) return const Color(0xFF90CAF9);
    if (weatherCode <= 49) return const Color(0xFFB0BEC5);
    return const Color(0xFF64B5F6);
  }
}

// ══════════════════════════════════════════════════════════════════════
// Main Screen
// ══════════════════════════════════════════════════════════════════════
class WorkspaceListScreen extends StatefulWidget {
  const WorkspaceListScreen({super.key});

  @override
  State<WorkspaceListScreen> createState() => _WorkspaceListScreenState();
}

class _WorkspaceListScreenState extends State<WorkspaceListScreen> {
  final ApiService _api = ApiService();
  final Dio _dio = Dio();

  List<dynamic> _workspaces = [];
  bool _isLoading = true;
  String? _error;

  // Weather state
  _WeatherData? _weather;
  bool _isLoadingWeather = true;
  String? _weatherError;

  @override
  void initState() {
    super.initState();
    _fetchWorkspaces();
    _fetchWeather();
  }

  // ── Data lahan ────────────────────────────────────────────────────
  Future<void> _fetchWorkspaces() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await _api.getMyWorkspaces();
      if (res.statusCode == 200 && res.data['success'] == true) {
        setState(() {
          _workspaces = res.data['data'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() { _error = 'Gagal memuat data lahan.'; _isLoading = false; });
      }
    } catch (e) {
      setState(() { _error = 'Tidak dapat terhubung ke server.'; _isLoading = false; });
    }
  }

  // ── Cuaca real-time via Open-Meteo (gratis, tanpa API key) ────────
  Future<void> _fetchWeather() async {
    setState(() { _isLoadingWeather = true; _weatherError = null; });
    try {
      // 1. Minta izin lokasi
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.deniedForever ||
          permission == LocationPermission.denied) {
        // Fallback ke koordinat Subang, Jawa Barat
        await _fetchWeatherByCoords(
          lat: -6.5745,
          lon: 107.7576,
          city: 'Subang, Jawa Barat',
        );
        return;
      }

      // 2. Dapatkan posisi
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.low,
        timeLimit: const Duration(seconds: 8),
      );

      // 3. Reverse geocode (Open-Meteo tidak butuh key)
      String cityName = 'Lokasi Saat Ini';
      try {
        final geoRes = await _dio.get(
          'https://nominatim.openstreetmap.org/reverse',
          queryParameters: {
            'lat': position.latitude,
            'lon': position.longitude,
            'format': 'json',
          },
          options: Options(
            headers: {'User-Agent': 'KaruMobileApp/1.0'},
            receiveTimeout: const Duration(seconds: 6),
          ),
        );
        if (geoRes.statusCode == 200) {
          final addr = geoRes.data['address'];
          final city = addr?['city'] ??
              addr?['town'] ??
              addr?['village'] ??
              addr?['county'] ??
              'Tidak Diketahui';
          final state = addr?['state'] ?? '';
          cityName = state.isNotEmpty ? '$city, $state' : city;
        }
      } catch (_) {
        // Abaikan error geocoding, lanjut dengan koordinat
      }

      await _fetchWeatherByCoords(
        lat: position.latitude,
        lon: position.longitude,
        city: cityName,
      );
    } catch (e) {
      // Fallback ke Subang jika gagal
      await _fetchWeatherByCoords(
        lat: -6.5745,
        lon: 107.7576,
        city: 'Subang, Jawa Barat',
      );
    }
  }

  Future<void> _fetchWeatherByCoords({
    required double lat,
    required double lon,
    required String city,
  }) async {
    try {
      final res = await _dio.get(
        'https://api.open-meteo.com/v1/forecast',
        queryParameters: {
          'latitude': lat,
          'longitude': lon,
          'current_weather': true,
          'timezone': 'Asia/Jakarta',
        },
        options: Options(receiveTimeout: const Duration(seconds: 10)),
      );

      if (res.statusCode == 200) {
        final cw = res.data['current_weather'];
        setState(() {
          _weather = _WeatherData(
            temperature: (cw['temperature'] as num).toDouble(),
            weatherCode: (cw['weathercode'] as num).toInt(),
            windspeed: (cw['windspeed'] as num).toDouble(),
            cityName: city,
          );
          _isLoadingWeather = false;
        });
      } else {
        setState(() { _weatherError = 'Gagal'; _isLoadingWeather = false; });
      }
    } catch (e) {
      setState(() { _weatherError = 'Offline'; _isLoadingWeather = false; });
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────
  int get _makroCount => _workspaces.where((w) {
        final cat = (w['category'] ?? '').toString().toLowerCase();
        return cat.contains('makro');
      }).length;

  int get _mikroCount => _workspaces.where((w) {
        final cat = (w['category'] ?? '').toString().toLowerCase();
        return cat.contains('mikro');
      }).length;

  // ══════════════════════════════════════════════════════════════════
  // BUILD
  // ══════════════════════════════════════════════════════════════════
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _kPageBg,
      // ── AppBar standar (hijau KARU, seperti sebelumnya) ──────────
      appBar: AppBar(
        title: const Text(
          'WorkSpace',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
        backgroundColor: KaruTheme.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          if (!_isLoading)
            IconButton(
              icon: const Icon(Icons.refresh_rounded),
              onPressed: () {
                _fetchWorkspaces();
                _fetchWeather();
              },
              tooltip: 'Refresh',
            ),
        ],
      ),
      body: _isLoading
          ? _buildShimmerList()
          : _error != null
              ? _buildError()
              : RefreshIndicator(
                  onRefresh: () async {
                    _fetchWeather();
                    await _fetchWorkspaces();
                  },
                  color: KaruTheme.primary,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                    children: [
                      // ── Summary Row: Weather + Count Cards ────────
                      _buildSummaryRow(),
                      const SizedBox(height: 16),
                      // ── Label list ────────────────────────────────
                      if (_workspaces.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Text(
                            'Lahan Saya (${_workspaces.length})',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              color: Color(0xFF424242),
                            ),
                          ),
                        ),
                      // ── Workspace Cards ───────────────────────────
                      if (_workspaces.isEmpty)
                        _buildEmpty()
                      else
                        ...List.generate(
                          _workspaces.length,
                          (i) => _buildWorkspaceCard(_workspaces[i]),
                        ),
                    ],
                  ),
                ),
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // Summary Row: [Weather | Count Makro ]
  //              [        | Count Mikro ]
  // ══════════════════════════════════════════════════════════════════
  Widget _buildSummaryRow() {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Kiri: Weather card ─────────────────────────────────
          Expanded(
            flex: 5,
            child: _buildWeatherCard(),
          ),
          const SizedBox(width: 12),
          // ── Kanan: 2 count cards ───────────────────────────────
          Expanded(
            flex: 4,
            child: Column(
              children: [
                Expanded(
                  child: _buildCountCard(
                    count: _makroCount,
                    label: 'Lahan Makro',
                    accentColor: const Color(0xFF7B1FA2),
                    borderColor: const Color(0xFFCE93D8),
                  ),
                ),
                const SizedBox(height: 10),
                Expanded(
                  child: _buildCountCard(
                    count: _mikroCount,
                    label: 'Lahan Mikro',
                    accentColor: KaruTheme.primary,
                    borderColor: KaruTheme.accent,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Weather Card ──────────────────────────────────────────────────
  Widget _buildWeatherCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: _isLoadingWeather
          ? _buildWeatherShimmer()
          : _weatherError != null
              ? _buildWeatherOffline()
              : _buildWeatherContent(),
    );
  }

  Widget _buildWeatherContent() {
    final w = _weather!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Ikon cuaca besar
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: w.iconColor.withOpacity(0.15),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(w.icon, color: w.iconColor, size: 28),
        ),
        const SizedBox(height: 10),
        // Suhu
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${w.temperature.toStringAsFixed(0)}',
              style: const TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A1A1A),
                height: 1,
              ),
            ),
            const Padding(
              padding: EdgeInsets.only(top: 4),
              child: Text(
                '°C',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF757575),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        // Kondisi
        Text(
          w.condition,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Color(0xFF424242),
          ),
        ),
        const SizedBox(height: 4),
        // Kota
        Text(
          w.cityName,
          style: TextStyle(
            fontSize: 10,
            color: Colors.grey[500],
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 6),
        // Angin
        Row(
          children: [
            Icon(Icons.air_rounded, size: 12, color: Colors.grey[500]),
            const SizedBox(width: 3),
            Text(
              '${w.windspeed.toStringAsFixed(0)} km/h',
              style: TextStyle(fontSize: 10, color: Colors.grey[500]),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildWeatherShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(width: 44, height: 44, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12))),
          const SizedBox(height: 8),
          Container(width: 70, height: 30, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(6))),
          const SizedBox(height: 6),
          Container(width: 50, height: 12, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(4))),
          const SizedBox(height: 4),
          Container(width: 90, height: 10, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(4))),
        ],
      ),
    );
  }

  Widget _buildWeatherOffline() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.cloud_off_rounded, color: Colors.grey[400], size: 32),
        const SizedBox(height: 8),
        Text(
          'Cuaca tidak tersedia',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 11, color: Colors.grey[500]),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _fetchWeather,
          child: Text(
            'Coba lagi',
            style: TextStyle(
              fontSize: 11,
              color: KaruTheme.primary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  // ── Count Card ────────────────────────────────────────────────────
  Widget _buildCountCard({
    required int count,
    required String label,
    required Color accentColor,
    required Color borderColor,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border(
          left: BorderSide(color: accentColor, width: 4),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Text(
            '$count',
            style: TextStyle(
              fontSize: 30,
              fontWeight: FontWeight.bold,
              color: accentColor,
              height: 1,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Color(0xFF616161),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // Workspace Card (rich card dengan foto)
  // ══════════════════════════════════════════════════════════════════
  Widget _buildWorkspaceCard(dynamic ws) {
    final name = ws['name'] ?? '-';
    final category = ws['category'] ?? '';
    final imageUrl = _resolveImageUrl(ws['imageUrl']);
    final area = ws['area'];
    final unit = _getAreaUnit(category);

    final isMakro = category.toString().toLowerCase().contains('makro');
    final badgeColor =
        isMakro ? const Color(0xFF7B1FA2) : KaruTheme.primary;
    final badgeLabel = isMakro ? 'LAHAN MAKRO' : 'LAHAN MIKRO';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Cover Image ──────────────────────────────────────────
          ClipRRect(
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(20)),
            child: Stack(
              children: [
                SizedBox(
                  height: 170,
                  width: double.infinity,
                  child: imageUrl != null
                      ? CachedNetworkImage(
                          imageUrl: imageUrl,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => _imagePlaceholder(),
                          errorWidget: (_, __, ___) => _imageFallback(),
                        )
                      : _imageFallback(),
                ),
                // Badge kategori
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: badgeColor,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      badgeLabel,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
                // Badge area
                if (area != null)
                  Positioned(
                    bottom: 10,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.55),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.straighten_rounded,
                              color: Colors.white, size: 12),
                          const SizedBox(width: 4),
                          Text(
                            '$area $unit',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // ── Info Section ────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0D1612),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (ws['description'] != null &&
                          ws['description'].toString().isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          ws['description'].toString(),
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                            height: 1.4,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                // Tombol navigate
                GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => WorkspaceMapScreen(
                          workspaceId: ws['id'].toString(),
                          workspaceName: name,
                        ),
                      ),
                    );
                  },
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F3),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Colors.grey.withOpacity(0.2),
                        width: 1,
                      ),
                    ),
                    child: const Icon(
                      Icons.open_in_new_rounded,
                      color: Color(0xFF0D1612),
                      size: 18,
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

  // ══════════════════════════════════════════════════════════════════
  // Helper widgets
  // ══════════════════════════════════════════════════════════════════

  String? _resolveImageUrl(dynamic raw) {
    if (raw == null) return null;
    final s = raw.toString().trim();
    if (s.isEmpty) return null;
    if (s.startsWith('http')) return s;
    if (s.startsWith('/')) return '${ApiConfig.baseUrl}$s';
    return null;
  }

  String _getAreaUnit(String category) {
    return category.toLowerCase().contains('makro') ? 'Ha' : 'm²';
  }

  Widget _imagePlaceholder() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Container(color: Colors.white),
    );
  }

  Widget _imageFallback() {
    return Container(
      color: const Color(0xFFE8F5E9),
      child: Center(
        child: Icon(
          Icons.landscape_rounded,
          color: KaruTheme.primary.withOpacity(0.4),
          size: 48,
        ),
      ),
    );
  }

  Widget _buildShimmerList() {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      itemCount: 3,
      itemBuilder: (_, index) {
        if (index == 0) {
          // Shimmer untuk summary row
          return Column(
            children: [
              SizedBox(
                height: 130,
                child: Row(
                  children: [
                    Expanded(
                      flex: 5,
                      child: Shimmer.fromColors(
                        baseColor: Colors.grey[300]!,
                        highlightColor: Colors.grey[100]!,
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 4,
                      child: Column(
                        children: [
                          Expanded(
                            child: Shimmer.fromColors(
                              baseColor: Colors.grey[300]!,
                              highlightColor: Colors.grey[100]!,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Expanded(
                            child: Shimmer.fromColors(
                              baseColor: Colors.grey[300]!,
                              highlightColor: Colors.grey[100]!,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
          );
        }
        // Shimmer untuk workspace cards
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Shimmer.fromColors(
            baseColor: Colors.grey[300]!,
            highlightColor: Colors.grey[100]!,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 170,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius:
                        BorderRadius.vertical(top: Radius.circular(20)),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                          height: 16,
                          width: 180,
                          color: Colors.white),
                      const SizedBox(height: 8),
                      Container(
                          height: 12,
                          width: 120,
                          color: Colors.white),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.wifi_off_rounded, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _fetchWorkspaces,
              icon: const Icon(Icons.refresh),
              label: const Text('Coba Lagi'),
              style: ElevatedButton.styleFrom(
                backgroundColor: KaruTheme.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: KaruTheme.primary.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.landscape_outlined,
                size: 40,
                color: KaruTheme.primary.withOpacity(0.5),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Belum ada lahan yang ditugaskan',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Color(0xFF424242),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Hubungi admin untuk mendapatkan akses ke lahan',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Colors.grey[500]),
            ),
          ],
        ),
      ),
    );
  }
}
