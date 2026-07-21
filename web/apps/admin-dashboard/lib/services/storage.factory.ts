import { LocalStorageService } from './storage-local';
import { SupabaseStorageService } from './storage-supabase';
import type { IStorageService } from './storage.service';

/**
 * Factory untuk memilih Storage Provider berdasarkan env STORAGE_PROVIDER.
 * - 'local'    → simpan ke /public/uploads/scans/ (development)
 * - 'supabase' → simpan ke Supabase Storage bucket (production)
 */

let _instance: IStorageService | null = null;

export function getStorageService(): IStorageService {
  if (_instance) return _instance;

  if (process.env.STORAGE_PROVIDER === 'supabase') {
    try {
      _instance = new SupabaseStorageService();
    } catch (e) {
      console.warn('Gagal inisialisasi SupabaseStorageService, menggunakan LocalStorageService fallback:', e);
      _instance = new LocalStorageService();
    }
  } else {
    _instance = new LocalStorageService();
  }

  return _instance;
}
