'use server';

import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { logActivity } from '@/lib/activity-logger';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getStorageService } from '@/lib/services/storage.factory';

/** Ambil profil user yang sedang login dari sesi aktif */
export async function getCurrentUserProfile() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return { success: false, message: 'Tidak ada sesi aktif.' };
        }

        const [userData] = await db
            .select()
            .from(user)
            .where(eq(user.id, session.user.id))
            .limit(1);

        if (!userData) {
            return { success: false, message: 'Pengguna tidak ditemukan.' };
        }

        return { success: true, data: userData };
    } catch (error: any) {
        return { success: false, message: error.message || 'Gagal memuat profil.' };
    }
}

/** Update nama dan nomor HP pengguna yang sedang login */
export async function updateProfile(data: { name: string; phone: string }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return { success: false, message: 'Tidak ada sesi aktif.' };
        }

        await db
            .update(user)
            .set({
                name: data.name,
                phone: data.phone || null,
                updatedAt: new Date(),
            })
            .where(eq(user.id, session.user.id));

        revalidatePath('/dashboard/profile');

        // Catat Log Aktivitas
        await logActivity({
            type: 'update',
            action: 'Pembaruan Profil',
            description: `Pengguna memperbarui informasi profil (Nama/Telepon).`,
        });

        return { success: true, message: 'Profil berhasil diperbarui.' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Gagal memperbarui profil.' };
    }
}

/** Ganti password pengguna yang sedang login */
export async function changePassword(data: { currentPassword: string; newPassword: string }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return { success: false, message: 'Tidak ada sesi aktif.' };
        }

        // Verifikasi password lama via Better Auth
        await auth.api.changePassword({
            body: {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            },
            headers: await headers(),
        });

        // Catat Log Aktivitas
        await logActivity({
            type: 'auth',
            action: 'Perubahan Password',
            description: `Pengguna berhasil melakukan perubahan password akun.`,
        });

        return { success: true, message: 'Password berhasil diubah.' };
    } catch (error: any) {
        const msg = error?.body?.message || error.message || 'Password saat ini salah.';
        return { success: false, message: msg };
    }
}

/** Upload foto profil — simpan ke /public/uploads/avatars/, simpan relative path ke DB */
export async function uploadProfilePhoto(formData: FormData) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return { success: false, message: 'Tidak ada sesi aktif.' };
        }

        const file = formData.get('photo') as File;
        if (!file || file.size === 0) {
            return { success: false, message: 'Tidak ada file yang dipilih.' };
        }

        // Validasi tipe file
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return { success: false, message: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.' };
        }

        // Max 2MB
        if (file.size > 2 * 1024 * 1024) {
            return { success: false, message: 'Ukuran file maksimal 2MB.' };
        }

        // Nama file unik
        const ext = file.name.split('.').pop() ?? 'jpg';
        const filename = `${session.user.id}-${Date.now()}.${ext}`;

        // Konversi ke Buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload via storage service
        const storageService = getStorageService();
        const imageUrl = await storageService.upload(buffer, filename, 'avatars');

        // Simpan URL ke DB
        await db
            .update(user)
            .set({ image: imageUrl, updatedAt: new Date() })
            .where(eq(user.id, session.user.id));

        revalidatePath('/dashboard/profile');
        revalidatePath('/dashboard');

        // Catat Log Aktivitas
        await logActivity({
            type: 'update',
            action: 'Unggah Foto Profil',
            description: `Pengguna memperbarui foto profil mereka.`,
        });

        return { success: true, message: 'Foto profil berhasil diperbarui.', imagePath: imageUrl };
    } catch (error: any) {
        return { success: false, message: error.message || 'Gagal mengupload foto.' };
    }
}
