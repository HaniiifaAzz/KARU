'use server';

import { getStorageService } from '@/lib/services/storage.factory';

/**
 * Utility untuk menyimpan file upload secara umum (otomatis switch lokal/supabase)
 */
export async function uploadFileAction(formData: FormData, folder: string = 'general') {
  try {
    const file = formData.get('file') as File;
    if (!file || file.size === 0) {
      return { success: false, message: 'Tidak ada file yang dipilih.' };
    }

    const storageService = getStorageService();

    // Nama file unik
    const ext = file.name.split('.').pop() ?? 'jpg';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1000)}.${ext}`;
    
    // Konversi File ke Buffer untuk storage service
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload via storage service
    const publicUrl = await storageService.upload(buffer, filename, folder);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Upload error:', error);
    return { success: false, message: error.message || 'Gagal mengupload file.' };
  }
}

