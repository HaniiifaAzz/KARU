import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { getMobileUser } from '@/lib/auth/auth-guard';

export async function POST(req: Request) {
  try {
    const user = await getMobileUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid notificationIds array' }, { status: 400 });
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          inArray(notifications.id, notificationIds),
          eq(notifications.userId, user.id)
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error) {
    console.error('Error updating mobile notifications:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
