'use server';

import { ActivityLogRepository, ActivityLogInsert } from '@/lib/repositories/activity-log.repository';

const activityLogRepo = new ActivityLogRepository();

/**
 * Mencatat log aktivitas baru ke dalam sistem
 */
export async function createActivityLogAction(payload: {
  type: string;
  action: string;
  description: string;
  userId?: string | null;
  userRole?: string | null;
  userName?: string | null;
  ipAddress?: string | null;
}) {
  try {
    const result = await activityLogRepo.create({
      type: payload.type,
      action: payload.action,
      description: payload.description,
      userId: payload.userId,
      userRole: payload.userRole,
      userName: payload.userName,
      ipAddress: payload.ipAddress || '127.0.0.1',
    });
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error creating activity log:', error);
    return { success: false, error: error.message || 'Gagal mencatat log aktivitas.' };
  }
}

/**
 * Mengambil log aktivitas dengan filter dan pencarian
 */
export async function getActivityLogsAction(params?: {
  type?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const logs = await activityLogRepo.getLogs(params);
    return { success: true, data: logs };
  } catch (error: any) {
    console.error('Error fetching activity logs:', error);
    return { success: false, error: error.message || 'Gagal memuat log aktivitas.', data: [] };
  }
}

/**
 * Mengambil log aktivitas terbaru untuk dashboard
 */
export async function getRecentActivityLogsAction(limit = 5) {
  try {
    const logs = await activityLogRepo.getRecentLogs(limit);
    return { success: true, data: logs };
  } catch (error: any) {
    console.error('Error fetching recent activity logs:', error);
    return { success: false, error: error.message || 'Gagal memuat aktivitas terbaru.', data: [] };
  }
}
