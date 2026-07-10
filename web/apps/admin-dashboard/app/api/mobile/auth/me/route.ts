import { NextResponse } from 'next/server';
import { getMobileUser } from '@/lib/auth/auth-guard';
import { db } from '@/lib/db';
import { aiScanLogs } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getMobileUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get user scan stats
    const statsResult = await db
      .select({ totalScans: count() })
      .from(aiScanLogs)
      .where(eq(aiScanLogs.userId, user.id));

    const totalScans = statsResult[0].totalScans;

    // Simple leveling system
    let level = 'Pemula';
    let stars = 1;
    if (totalScans >= 100) {
      level = 'Master Ekologi';
      stars = 5;
    } else if (totalScans >= 51) {
      level = 'Ahli Lapangan';
      stars = 3;
    } else if (totalScans >= 11) {
      level = 'Penjelajah';
      stars = 2;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        image: user.image,
        stats: {
          totalScans,
          level,
          stars
        }
      }
    });
  } catch (error) {
    console.error('Error fetching mobile user profile:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
