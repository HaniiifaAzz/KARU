import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';
import 'dart:convert';

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
  final Completer<GoogleMapController> _controller = Completer();
  final ApiService _api = ApiService();

  bool _isLoading = true;
  String? _error;

  Position? _currentPosition;
  LatLng? _workspaceCenter;
  Set<Marker> _markers = {};
  Set<Polyline> _polylines = {};
  Set<Polygon> _polygons = {};

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
      _fitMapToBounds();
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
    // Kita coba ekstrak polygon jika ada, atau lat/lng jika point
    List<LatLng> polygonPoints = [];
    
    try {
      if (data['polygon_info'] != null) {
        // Coba parse jika format geojson atau custom struct
        // (Di sini disesuaikan dengan struktur respons API Anda, fallback sederhana)
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
          polygonId: const PolygonId('workspace_polygon'),
          points: polygonPoints,
          strokeColor: KaruTheme.primary,
          strokeWidth: 3,
          fillColor: KaruTheme.primary.withOpacity(0.2),
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
          markerId: const MarkerId('user_location'),
          position: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
          infoWindow: const InfoWindow(title: 'Lokasi Anda'),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
        )
      );
    }

    if (_workspaceCenter != null) {
      _markers.add(
        Marker(
          markerId: const MarkerId('workspace_location'),
          position: _workspaceCenter!,
          infoWindow: InfoWindow(title: widget.workspaceName),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
        )
      );
    }

    if (_currentPosition != null && _workspaceCenter != null) {
      _polylines.add(
        Polyline(
          polylineId: const PolylineId('route_line'),
          points: [
            LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
            _workspaceCenter!,
          ],
          color: KaruTheme.primary,
          width: 4,
          patterns: [PatternItem.dash(20), PatternItem.gap(10)], // Garis putus-putus
        )
      );
    }
  }

  Future<void> _fitMapToBounds() async {
    if (_currentPosition == null || _workspaceCenter == null) return;

    final GoogleMapController controller = await _controller.future;

    LatLngBounds bounds;
    final userLatLng = LatLng(_currentPosition!.latitude, _currentPosition!.longitude);
    
    if (userLatLng.latitude > _workspaceCenter!.latitude) {
      bounds = LatLngBounds(southwest: _workspaceCenter!, northeast: userLatLng);
    } else {
      bounds = LatLngBounds(southwest: userLatLng, northeast: _workspaceCenter!);
    }

    await Future.delayed(const Duration(milliseconds: 500));
    controller.animateCamera(CameraUpdate.newLatLngBounds(bounds, 100));
  }

  Future<void> _centerOnUser() async {
    if (_currentPosition == null) return;
    final GoogleMapController controller = await _controller.future;
    controller.animateCamera(CameraUpdate.newLatLngZoom(
      LatLng(_currentPosition!.latitude, _currentPosition!.longitude), 16));
  }

  Future<void> _centerOnWorkspace() async {
    if (_workspaceCenter == null) return;
    final GoogleMapController controller = await _controller.future;
    controller.animateCamera(CameraUpdate.newLatLngZoom(_workspaceCenter!, 16));
  }

  // Desain Map sederhana & clean (Retro style)
  final String _mapStyle = '''
  [
    {"featureType": "poi", "elementType": "labels", "stylers": [{"visibility": "off"}]},
    {"featureType": "transit", "elementType": "labels", "stylers": [{"visibility": "off"}]}
  ]
  ''';

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
          ? Center(child: CircularProgressIndicator(color: KaruTheme.primary))
          : _error != null
              ? _buildErrorState()
              : Stack(
                  children: [
                    GoogleMap(
                      initialCameraPosition: CameraPosition(
                        target: _workspaceCenter ?? 
                                (_currentPosition != null 
                                  ? LatLng(_currentPosition!.latitude, _currentPosition!.longitude) 
                                  : const LatLng(-6.200000, 106.816666)),
                        zoom: 14,
                      ),
                      markers: _markers,
                      polylines: _polylines,
                      polygons: _polygons,
                      myLocationEnabled: true,
                      myLocationButtonEnabled: false, // Kita buat custom button
                      zoomControlsEnabled: false,
                      mapToolbarEnabled: false,
                      onMapCreated: (GoogleMapController controller) {
                        _controller.complete(controller);
                        controller.setMapStyle(_mapStyle);
                      },
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
                                child: Icon(Icons.route_rounded, color: KaruTheme.primary),
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
