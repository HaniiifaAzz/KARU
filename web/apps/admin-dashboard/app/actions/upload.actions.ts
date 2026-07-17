'use server';

import { getStorageService } from '@/lib/services/storage.factory';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Utility untuk menyimpan file upload secara umum (otomatis switch lokal/supabase)
 */
export async function uploadFileAction(formData: FormData, folder: string = 'general') {
  try {
    const file = formData.get('file') as File;
    if (!file || file.size === 0) {
      return { success: false, message: 'Tidak ada file yang dipilih.' };
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return { success: false, message: 'Format file tidak didukung. Gunakan JPEG, PNG, WebP, atau GIF.' };
    }

    if (file.size > MAX_SIZE) {
      return { success: false, message: `Ukuran file terlalu besar (maksimal 5MB). File Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB.` };
    }

    const storageService = getStorageService();

    // Nama file unik
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
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

