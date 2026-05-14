'use server';

import { revalidatePath } from 'next/cache';
import { AiScanRepository } from '@/lib/repositories/ai-scan.repository';

const scanRepo = new AiScanRepository();

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
    revalidatePath('/dashboard/reports-ai');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting AI scan log:', error);
    return { success: false, error: error.message || 'Gagal menghapus log pindaian AI.' };
  }
}
