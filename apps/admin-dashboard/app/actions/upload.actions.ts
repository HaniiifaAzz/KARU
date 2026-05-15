'use server';

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * Utility untuk menyimpan file upload secara umum
 */
export async function uploadFileAction(formData: FormData, folder: string = 'general') {
  try {
    const file = formData.get('file') as File;
    if (!file || file.size === 0) {
      return { success: false, message: 'Tidak ada file yang dipilih.' };
    }

    // Validasi tipe file (Opsional, bisa disesuaikan di client)
    
    // Buat direktori jika belum ada
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    await mkdir(uploadDir, { recursive: true });

    // Nama file unik
    const ext = file.name.split('.').pop() ?? 'jpg';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1000)}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Simpan file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const relativePath = `/uploads/${folder}/${filename}`;
    return { success: true, url: relativePath };
  } catch (error: any) {
    console.error('Upload error:', error);
    return { success: false, message: error.message || 'Gagal mengupload file.' };
  }
}
