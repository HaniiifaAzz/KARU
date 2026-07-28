import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { account } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getMobileUser } from '@/lib/auth/auth-guard';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { logActivity } from '@/lib/activity-logger';

export async function POST(req: Request) {
  try {
    const authUser = await getMobileUser();
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Password lama dan baru wajib diisi' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'Password baru minimal 6 karakter' }, { status: 400 });
    }

    // Ambil data account credential milik user
    const [userAccount] = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, authUser.id),
          eq(account.providerId, 'credential')
        )
      )
      .limit(1);

    if (!userAccount || !userAccount.password) {
      return NextResponse.json({ success: false, error: 'Akun tidak ditemukan' }, { status: 404 });
    }

    // Verifikasi password lama
    const isPasswordValid = await verifyPassword({
      password: oldPassword,
      hash: userAccount.password,
    });

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: 'Password lama salah' }, { status: 400 });
    }

    // Hash password baru
    const hashedPassword = await hashPassword(newPassword);

    // Update password di DB
    await db
      .update(account)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(account.id, userAccount.id));

    // Catat log aktivitas
    await logActivity({
      type: 'auth',
      action: 'Perubahan Password Mobile',
      description: `Pengguna ${authUser.name} mengubah password melalui aplikasi mobile.`,
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role || 'pengguna',
    });

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah',
    });
  } catch (error) {
    console.error('Error changing password for mobile user:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
