import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

/// Global callback triggered on 401 — set by main.dart to navigate to login.
void Function()? onAuth401;

class ApiService {
  final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiService()
      : _dio = Dio(BaseOptions(
          baseUrl: ApiConfig.baseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 15),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        )) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          if (e.response?.statusCode == 401) {
            await _storage.delete(key: 'auth_token');
            onAuth401?.call();
          }
          return handler.next(e);
        },
      ),
    );
  }

  Dio get dio => _dio;

  // ── Auth ────────────────────────────────────────────────────────────

  Future<Response> login(String email, String password, {bool rememberMe = true}) async {
    return await _dio.post(ApiConfig.login, data: {
      'email': email,
      'password': password,
      'rememberMe': rememberMe,
    });
  }

  Future<void> saveToken(String token) async {
    await _storage.write(key: 'auth_token', value: token);
  }

  Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'auth_token');
  }

  Future<Response> getMe() async {
    return await _dio.get(ApiConfig.authMe);
  }

  // ── Banners ─────────────────────────────────────────────────────────

  Future<Response> getBanners() async {
    return await _dio.get(ApiConfig.banners);
  }

  // ── Workspaces ──────────────────────────────────────────────────────

  Future<Response> getMyWorkspaces() async {
    return await _dio.get(ApiConfig.workspaces);
  }

  Future<Response> getWorkspaceGeofence(String workspaceId) async {
    return await _dio.get(ApiConfig.geofence(workspaceId));
  }

  // ── Scans ───────────────────────────────────────────────────────────

  Future<Response> submitScan({
    required double latitude,
    required double longitude,
    String? workspaceId,
    String? qrNodeId,
    required String imageUrl,
  }) async {
    return await _dio.post(ApiConfig.scans, data: {
      'lat': latitude,
      'lng': longitude,
      'latitude': latitude,
      'longitude': longitude,
      if (workspaceId != null) 'workspaceId': workspaceId,
      if (qrNodeId != null) 'qrNodeId': qrNodeId,
      'imageUrl': imageUrl,
    });
  }

  Future<Response> getScanHistory({int page = 1, int limit = 20}) async {
    return await _dio.get(ApiConfig.scanHistory, queryParameters: {
      'page': page,
      'limit': limit,
    });
  }

  Future<Response> getScanStats() async {
    return await _dio.get(ApiConfig.scanStats);
  }

  // ── Notifications ───────────────────────────────────────────────────

  Future<Response> getNotifications({int page = 1, int limit = 20}) async {
    return await _dio.get(ApiConfig.notifications, queryParameters: {
      'page': page,
      'limit': limit,
    });
  }

  Future<Response> markNotificationsRead(List<int> ids) async {
    return await _dio.post(ApiConfig.notificationsRead, data: {
      'ids': ids,
    });
  }

  // ── Profile ─────────────────────────────────────────────────────────

  Future<Response> updateProfile({
    String? name,
    String? phone,
  }) async {
    return await _dio.put(ApiConfig.profileUpdate, data: {
      if (name != null) 'name': name,
      if (phone != null) 'phone': phone,
    });
  }

  // ── Upload ──────────────────────────────────────────────────────────

  Future<Response> uploadFile(String filePath, {String fieldName = 'file'}) async {
    final fileName = filePath.split('/').last;
    final formData = FormData.fromMap({
      fieldName: await MultipartFile.fromFile(filePath, filename: fileName),
    });
    return await _dio.post(ApiConfig.upload, data: formData);
  }

  // ── Settings ────────────────────────────────────────────────────────

  Future<Response> getWhatsappAdmin() async {
    return await _dio.get(ApiConfig.whatsappAdmin);
  }

  // ── Remember Me ─────────────────────────────────────────────────────

  Future<void> setRememberMe(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('remember_me', value);
  }

  Future<bool> getRememberMe() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('remember_me') ?? true;
  }
}
