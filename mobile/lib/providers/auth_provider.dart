import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  bool _isLoading = false;
  bool get isLoading => _isLoading;
  
  String? _error;
  String? get error => _error;
  
  bool _isAuthenticated = false;
  bool get isAuthenticated => _isAuthenticated;
  
  Map<String, dynamic>? _user;
  Map<String, dynamic>? get user => _user;

  /// Check if user has a stored token (auto-login).
  Future<bool> checkAuth() async {
    final token = await _apiService.getToken();
    if (token != null) {
      _isAuthenticated = true;
      notifyListeners();
      return true;
    }
    return false;
  }

  /// Login via BetterAuth email/password endpoint.
  /// BetterAuth returns: { "redirect": false, "token": "...", "user": {...} }
  Future<bool> login(String email, String password, {bool rememberMe = true}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.login(email, password, rememberMe: rememberMe);
      if (response.statusCode == 200) {
        // BetterAuth sign-in/email returns token at top level
        final token = response.data['token'] as String?;

        if (token != null && token.isNotEmpty) {
          await _apiService.saveToken(token);
          await _apiService.setRememberMe(rememberMe);
          _isAuthenticated = true;
          _isLoading = false;
          notifyListeners();
          return true;
        }
      }
      // BetterAuth returns { message, code } on error
      final errorMsg = response.data['message'];
      _error = errorMsg ?? 'Login gagal. Cek kembali email dan password Anda.';
    } on DioException catch (e) {
      // BetterAuth returns error in response body even on 401
      if (e.response?.statusCode == 401 || e.response?.statusCode == 403) {
        final errorMsg = e.response?.data?['message'];
        _error = errorMsg ?? 'Email atau password salah.';
      } else if (e.type == DioExceptionType.connectionTimeout ||
                 e.type == DioExceptionType.receiveTimeout) {
        _error = 'Koneksi timeout. Periksa jaringan Anda.';
      } else if (e.type == DioExceptionType.connectionError) {
        _error = 'Tidak dapat terhubung ke server. Pastikan server berjalan.';
      } else {
        _error = 'Terjadi kesalahan jaringan. Silakan coba lagi.';
      }
    } catch (e) {
      _error = 'Terjadi kesalahan sistem.';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  /// Fetch user profile from /api/mobile/auth/me.
  /// Response: { "success": true, "data": { "id", "name", "email", "phone", "role", "image", "stats": {...} } }
  Future<void> fetchProfile() async {
    try {
      final response = await _apiService.getMe();
      if (response.statusCode == 200 && response.data['success'] == true) {
        _user = response.data['data'] as Map<String, dynamic>?;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Gagal mengambil profil: $e');
    }
  }

  /// Logout: clear token and reset state.
  Future<void> logout() async {
    await _apiService.logout();
    _isAuthenticated = false;
    _user = null;
    notifyListeners();
  }
}
