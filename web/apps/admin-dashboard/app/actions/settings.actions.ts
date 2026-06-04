'use server';

import { revalidatePath } from 'next/cache';
import { SettingsRepository } from '@/lib/repositories/settings.repository';
import { logActivity } from '@/lib/activity-logger';

const settingsRepo = new SettingsRepository();

/**
 * Mengambil data pengaturan sistem saat ini
 */
export async function getSystemSettingsAction() {
  try {
    const settings = await settingsRepo.getSettings();
    return { success: true, data: settings };
  } catch (error: any) {
    console.error('Error fetching system settings:', error);
    return { success: false, error: error.message || 'Gagal memuat pengaturan sistem.' };
  }
}

/**
 * Memperbarui pengaturan sistem
 */
export async function updateSystemSettingsAction(data: any) {
  try {
    const result = await settingsRepo.updateSettings(data);
    
    // Catat log aktivitas
    await logActivity({
      type: 'system',
      action: 'Pembaruan Pengaturan Sistem',
      description: 'Memperbarui konfigurasi identitas atau preferensi sistem (CMS).',
    });

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard'); // Mungkin ada logo/nama di dashboard utama
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error updating system settings:', error);
    return { success: false, error: error.message || 'Gagal memperbarui pengaturan sistem.' };
  }
}
