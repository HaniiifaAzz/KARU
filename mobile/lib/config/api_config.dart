import 'dart:io';

class ApiConfig {
  // Use 10.0.2.2 for Android Emulator to access localhost
  // Use actual IP address for physical devices
  static String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3000'; // Default Next.js port
    }
    return 'http://localhost:3000';
  }

  // Endpoints
  static const String login = '/api/auth/sign-in/email'; // BetterAuth standard
  static const String authMe = '/api/mobile/auth/me';
  
  static const String banners = '/api/mobile/banners';
  
  static const String workspaces = '/api/mobile/workspaces/my';
  static String geofence(String workspaceId) => '/api/mobile/workspaces/$workspaceId/geofence';
  
  static const String scans = '/api/mobile/scans';
  static const String scanHistory = '/api/mobile/scans/history';
  static const String scanStats = '/api/mobile/scans/stats';
  
  static const String notifications = '/api/mobile/notifications';
  static const String notificationsRead = '/api/mobile/notifications/read';
  
  static const String profileUpdate = '/api/mobile/profile/update';
  static const String whatsappAdmin = '/api/mobile/whatsapp-admin';
  static const String upload = '/api/mobile/upload';
}
