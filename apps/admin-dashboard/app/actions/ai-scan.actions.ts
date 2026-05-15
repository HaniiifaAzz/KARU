'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { AiScanRepository } from '@/lib/repositories/ai-scan.repository';
import { createActivityLogAction } from '@/app/actions/activity-log.actions';

const scanRepo = new AiScanRepository();

// Helper pencatatan log otomatis
async function logAiScanActivity(type: string, action: string, description: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userName = session?.user?.name || session?.user?.email || 'Administrator';
    const userRole = (session?.user as any)?.role || 'Administrator';

    await createActivityLogAction({
      type,
      action,
      description,
      userId: session?.user?.id || null,
      userName,
      userRole,
    });
  } catch (err) {
    console.error('Gagal mencatat log aktivitas pindaian AI:', err);
  }
}

/**
 * Mengambil semua riwayat log pindaian AI beserta relasinya
 */
export async function getAllScanLogsAction() {
  try {
    const logs = await scanRepo.getAllScanLogs();
    return { success: true, data: logs };
  } catch (error: any) {
    console.error('Error fetching AI scan logs:', error);
    return { success: false, error: error.message || 'Gagal memuat log pindaian AI.', data: [] };
  }
}

/**
 * Menghapus log pindaian AI berdasarkan ID
 */
export async function deleteScanLogAction(id: number) {
  try {
    await scanRepo.deleteScanLog(id);

    await logAiScanActivity(
      'delete',
      'Penghapusan Riwayat Diagnosis AI',
      `Menghapus permanen rekam log diagnosis pindaian AI ID #${id} dari pangkalan data.`
    );

    revalidatePath('/dashboard/reports-ai');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting AI scan log:', error);
    return { success: false, error: error.message || 'Gagal menghapus log pindaian AI.' };
  }
}
