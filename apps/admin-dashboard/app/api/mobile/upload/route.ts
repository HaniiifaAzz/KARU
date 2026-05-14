import { NextResponse } from 'next/server';
import { getStorageService } from '@/lib/services/storage.factory';

/**
 * POST /api/mobile/upload
 * Upload foto tanaman dari mobile app.
 * Menyimpan ke lokal atau Supabase sesuai STORAGE_PROVIDER env.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Field "file" wajib dikirim.' },
        { status: 400 }
      );
    }

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Format file harus JPEG, PNG, atau WebP.' },
        { status: 400 }
      );
    }

    // Validasi ukuran (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Ukuran file maksimal 10MB.' },
        { status: 400 }
      );
    }

    // Buat nama file unik
    const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
    const fileName = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Upload via storage service (lokal atau Supabase)
    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = getStorageService();
    const imageUrl = await storage.upload(buffer, fileName);

    return NextResponse.json(
      { success: true, imageUrl, fileName },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengupload file.' },
      { status: 500 }
    );
  }
}
