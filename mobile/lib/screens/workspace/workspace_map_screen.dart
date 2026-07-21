import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';

class WorkspaceMapScreen extends StatefulWidget {
  final String workspaceId;
  final String workspaceName;

  const WorkspaceMapScreen({
    super.key,
    required this.workspaceId,
    required this.workspaceName,
  });

  @override
  State<WorkspaceMapScreen> createState() => _WorkspaceMapScreenState();
}

class _WorkspaceMapScreenState extends State<WorkspaceMapScreen> {
  final MapController _mapController = MapController();
  final ApiService _api = ApiService();

  bool _isLoading = true;
  String? _error;

  Position? _currentPosition;
  LatLng? _workspaceCenter;
  
  List<Marker> _markers = [];
  List<Polyline> _polylines = [];
  List<Polygon> _polygons = [];

  @override
  void initState() {
    super.initState();
    _initMapData();
  }

  Future<void> _initMapData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // 1. Get User Location
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Location services are disabled.');
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Location permissions are denied');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception('Location permissions are permanently denied, we cannot request permissions.');
      }

      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      try {
        final res = await _api.getWorkspaceGeofence(widget.workspaceId);
        if (res.statusCode == 200 && res.data['success'] == true) {
          _parseGeofenceData(res.data['data']);
        } else {
          _useFallbackWorkspaceLocation();
        }
      } catch (apiError) {
        debugPrint('Geofence API Error: $apiError');
        // Gunakan lokasi fallback (misal: Subang) agar peta tetap bisa dirender
        _useFallbackWorkspaceLocation();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Data geofence asli tidak tersedia dari server (500). Menggunakan lokasi default.'),
              backgroundColor: Colors.orange,
              duration: Duration(seconds: 3),
            ),
          );
        }
      }

      _buildMapLayers();

    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _fitMapToBounds();
      });
    }
  }

  void _useFallbackWorkspaceLocation() {
    // Memberikan lokasi default (misalnya pusat kota Subang) 
    // jika API gagal agar peta tetap bisa dirender dan navigasi terlihat.
    _workspaceCenter = const LatLng(-6.5745, 107.7576);
  }

  void _parseGeofenceData(dynamic data) {
    if (data == null) return;
    
    // Asumsi API mengembalikan geojson / polygon coordinates
    List<LatLng> polygonPoints = [];
    
    try {
      if (data['polygon_info'] != null) {
        final dynamic p = data['polygon_info'];
        if (p is Map && p['coordinates'] != null) {
          final coords = p['coordinates'][0]; 
          for (var coord in coords) {
             polygonPoints.add(LatLng(coord[1], coord[0])); // geojson usually [lon, lat]
          }
        }
      }
    } catch (e) {
      debugPrint('Error parsing polygon: $e');
    }

    if (polygonPoints.isNotEmpty) {
      _polygons.add(
        Polygon(
          points: polygonPoints,
          borderColor: KaruTheme.primary,
          borderStrokeWidth: 3,
          color: KaruTheme.primary.withOpacity(0.2),
          isFilled: true,
        )
      );

      // Hitung center dari polygon
      double latSum = 0;
      double lngSum = 0;
      for (var p in polygonPoints) {
        latSum += p.latitude;
        lngSum += p.longitude;
      }
      _workspaceCenter = LatLng(latSum / polygonPoints.length, lngSum / polygonPoints.length);
    } else {
      // Fallback: Jika cuma ada lat / lng
      final double? lat = data['latitude'] != null ? double.tryParse(data['latitude'].toString()) : null;
      final double? lng = data['longitude'] != null ? double.tryParse(data['longitude'].toString()) : null;
      if (lat != null && lng != null) {
        _workspaceCenter = LatLng(lat, lng);
      }
    }
  }

  void _buildMapLayers() {
    _markers.clear();
    _polylines.clear();

    if (_currentPosition != null) {
      _markers.add(
        Marker(
          point: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
          width: 40,
          height: 40,
          child: const Icon(Icons.my_location, color: Colors.blue, size: 30),
        )
      );
    }

    if (_workspaceCenter != null) {
      _markers.add(
        Marker(
          point: _workspaceCenter!,
          width: 40,
          height: 40,
          child: const Icon(Icons.location_on, color: Colors.green, size: 40),
        )
      );
    }

    if (_currentPosition != null && _workspaceCenter != null) {
      _polylines.add(
        Polyline(
          points: [
            LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
            _workspaceCenter!,
          ],
          color: KaruTheme.primary,
          strokeWidth: 4,
          isDotted: true,
        )
      );
    }
  }

  void _fitMapToBounds() {
    if (_currentPosition == null || _workspaceCenter == null) return;

    final bounds = LatLngBounds.fromPoints([
      LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
      _workspaceCenter!
    ]);

    _mapController.fitCamera(CameraFit.bounds(
      bounds: bounds,
      padding: const EdgeInsets.all(50.0),
    ));
  }

  void _centerOnUser() {
    if (_currentPosition == null) return;
    _mapController.move(LatLng(_currentPosition!.latitude, _currentPosition!.longitude), 16.0);
  }

  void _centerOnWorkspace() {
    if (_workspaceCenter == null) return;
    _mapController.move(_workspaceCenter!, 16.0);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.workspaceName, style: const TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: KaruTheme.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: KaruTheme.primary))
          : _error != null
              ? _buildErrorState()
              : Stack(
                  children: [
                    FlutterMap(
                      mapController: _mapController,
                      options: MapOptions(
                        initialCenter: _workspaceCenter ?? 
                                (_currentPosition != null 
                                  ? LatLng(_currentPosition!.latitude, _currentPosition!.longitude) 
                                  : const LatLng(-6.200000, 106.816666)),
                        initialZoom: 14.0,
                      ),
                      children: [
                        TileLayer(
                          urlTemplate: "http://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
                        ),
                        TileLayer(
                          urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                          userAgentPackageName: 'com.example.mobile',
                        ),
                        PolygonLayer(polygons: _polygons),
                        PolylineLayer(polylines: _polylines),
                        MarkerLayer(markers: _markers),
                      ],
                    ),

                    // Panel Info Jarak (di bagian atas map)
                    if (_currentPosition != null && _workspaceCenter != null)
                      Positioned(
                        top: 20,
                        left: 20,
                        right: 20,
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              )
                            ],
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: KaruTheme.primary.withOpacity(0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.route_rounded, color: KaruTheme.primary),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Jarak Garis Lurus', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${(Geolocator.distanceBetween(
                                        _currentPosition!.latitude, _currentPosition!.longitude, 
                                        _workspaceCenter!.latitude, _workspaceCenter!.longitude
                                      ) / 1000).toStringAsFixed(2)} km',
                                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                    // Custom Floating Buttons
                    Positioned(
                      bottom: 30,
                      right: 20,
                      child: Column(
                        children: [
                          FloatingActionButton(
                            heroTag: 'btn_workspace',
                            onPressed: _centerOnWorkspace,
                            backgroundColor: Colors.white,
                            foregroundColor: KaruTheme.primary,
                            child: const Icon(Icons.landscape_rounded),
                          ),
                          const SizedBox(height: 12),
                          FloatingActionButton(
                            heroTag: 'btn_user',
                            onPressed: _centerOnUser,
                            backgroundColor: KaruTheme.primary,
                            foregroundColor: Colors.white,
                            child: const Icon(Icons.my_location_rounded),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.location_off_rounded, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              _error ?? 'Unknown error',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.red[600], fontSize: 14),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _initMapData,
              style: ElevatedButton.styleFrom(
                backgroundColor: KaruTheme.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12)
              ),
              child: const Text('Coba Lagi', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}
