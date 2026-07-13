class ApiConfig {
  static const String baseUrl = 'https://karu-apps.vercel.app';
  // Local dev: 'http://10.0.2.2:3000' (emulator) / 'http://192.168.x.x:3000' (device)

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
