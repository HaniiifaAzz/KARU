import { createClient } from '@supabase/supabase-js';
import type { IStorageService } from './storage.service';

/**
 * Supabase Storage Provider
 * Menyimpan file ke Supabase Storage bucket untuk production.
 */
export class SupabaseStorageService implements IStorageService {
  private bucket = process.env.SUPABASE_BUCKET || 'karu-uploads';
  private supabase;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL dan SUPABASE_SERVICE_KEY harus diisi di .env untuk storage Supabase.'
      );
    }

    this.supabase = createClient(url, key);
  }

  async upload(file: Buffer, fileName: string, folder: string = 'general'): Promise<string> {
    const fullPath = `${folder}/${fileName}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(fullPath, file, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase upload gagal: ${error.message}`);
    }

    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(fullPath);

    return data.publicUrl;
  }


  async delete(filePath: string): Promise<void> {
    // Extract filename dari URL publik
    const fileName = filePath.split('/').pop();
    if (!fileName) return;

    await this.supabase.storage
      .from(this.bucket)
      .remove([fileName]);
  }
}
