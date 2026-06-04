'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { user, account, session } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { logActivity } from '@/lib/activity-logger';
import crypto from 'crypto';

// 1. Get All Users
export async function getUsers() {
    try {
        const users = await db.select().from(user).orderBy(desc(user.createdAt));
        return { success: true, data: users };
    } catch (error: any) {
        return { success: false, message: error.message || 'Gagal mengambil data pengguna.' };
    }
}

// Helper: Hash password using scrypt (same format as Better Auth)
async function hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 32, (err, derivedKey) => {
            if (err) reject(err);
            resolve(`${derivedKey.toString('hex')}:${salt}`);
        });
    });
}

// 2. Create User
export async function createUser(data: any) {
    try {
        const userId = crypto.randomBytes(16).toString('base64url').substring(0, 32);
        const now = new Date();

        // Insert ke tabel user
        await db.insert(user).values({
            id: userId,
            name: data.name,
            email: data.email,
            emailVerified: false,
            createdAt: now,
            updatedAt: now,
            role: data.role || 'pengguna',
            phone: data.phone || null,
            status: data.status || 'Aktif',
        });

        // Insert ke tabel account dengan password ter-hash (format Better Auth compatible)
        const hashedPassword = await hashPassword(data.password);
        await db.insert(account).values({
            id: crypto.randomBytes(16).toString('base64url').substring(0, 32),
            accountId: userId,
            providerId: 'credential',
            userId: userId,
            password: hashedPassword,
            createdAt: now,
            updatedAt: now,
        });

        revalidatePath('/dashboard/users-access');

        // Catat Log Aktivitas
        await logActivity({
            type: 'create',
            action: 'Pembuatan Pengguna',
            description: `Menambahkan pengguna baru "${data.name}" (${data.role}) ke dalam sistem.`,
        });

        return { success: true, message: 'Pengguna berhasil dibuat.' };
    } catch (error: any) {
        // Email duplikat
        if (error.message?.includes('unique')) {
            return { success: false, message: 'Email sudah terdaftar.' };
        }
        return { success: false, message: error.message || 'Terjadi kesalahan saat membuat pengguna.' };
    }
}

// 3. Update User (Hanya Role, Phone, Status. Email tidak bisa diganti di sini)
export async function updateUser(id: string, data: any) {
    try {
        await db.update(user)
            .set({
                name: data.name,
                role: data.role,
                phone: data.phone || null,
                status: data.status,
            })
            .where(eq(user.id, id));

        revalidatePath('/dashboard/users-access');

        // Catat Log Aktivitas
        await logActivity({
            type: 'update',
            action: 'Pembaruan Pengguna',
            description: `Memperbarui data profil/akses pengguna "${data.name}" (ID: ${id}).`,
        });

        return { success: true, message: 'Data pengguna diperbarui.' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Gagal memperbarui pengguna.' };
    }
}

// 4. Toggle Status (Aktif / Nonaktif)
export async function toggleUserStatus(id: string, newStatus: string) {
    try {
        await db.update(user)
            .set({ status: newStatus })
            .where(eq(user.id, id));

        revalidatePath('/dashboard/users-access');

        // Catat Log Aktivitas
        await logActivity({
            type: 'update',
            action: 'Perubahan Status Pengguna',
            description: `Mengubah status akses pengguna ID #${id} menjadi "${newStatus}".`,
        });

        return { success: true, message: `Status berhasil diubah menjadi ${newStatus}.` };
    } catch (error: any) {
        return { success: false, message: error.message || 'Gagal mengubah status.' };
    }
}

// 5. Delete User
export async function deleteUser(id: string) {
    try {
        console.log(`[deleteUser] Mencoba menghapus user ID: ${id}`);
        
        // Sebagai pengaman jika CASCADE belum aktif di level database, kita hapus data terkait secara eksplisit.
        // Hapus sesi & akun terlebih dahulu untuk menghindari foreign key constraint.
        await db.delete(session).where(eq(session.userId, id));
        await db.delete(account).where(eq(account.userId, id));
        
        // Hapus user utama
        await db.delete(user).where(eq(user.id, id));
        
        console.log(`[deleteUser] Berhasil menghapus user ID: ${id}`);

        revalidatePath('/dashboard/users-access');

        // Catat Log Aktivitas
        await logActivity({
            type: 'delete',
            action: 'Penghapusan Pengguna',
            description: `Menghapus akun pengguna dengan ID #${id} beserta seluruh data sesi terkait.`,
        });

        return { success: true, message: 'Pengguna dihapus.' };
    } catch (error: any) {
        console.error(`[deleteUser] Error saat menghapus user:`, error);
        return { success: false, message: error.message || 'Gagal menghapus pengguna.' };
    }
}
