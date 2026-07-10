import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiScanLogs } from '@/lib/db/schema';
import { eq, count, isNull, isNotNull, sql } from 'drizzle-orm';
import { getMobileUser } from '@/lib/auth/auth-guard';

export async function GET() {
  try {
    const user = await getMobileUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const totalScansResult = await db
      .select({ count: count() })
      .from(aiScanLogs)
      .where(eq(aiScanLogs.userId, user.id));

    // Stats count: Sehat (diseaseId is null / "Sehat") vs Sakit
    const diseaseStats = await db
      .select({
        diseaseId: aiScanLogs.diseaseId,
        count: count()
      })
      .from(aiScanLogs)
      .where(eq(aiScanLogs.userId, user.id))
      .groupBy(aiScanLogs.diseaseId);

    let sehat = 0;
    let sakit = 0;
    let hama = 0;
    // Note: We might need to join pestsDiseases to know if it's disease or pest.
    // For simplicity, just count if diseaseId exists.
    for (const row of diseaseStats) {
      if (!row.diseaseId) {
        sehat += row.count;
      } else {
        // Asumsi jika ada diseaseId = Sakit/Hama
        sakit += row.count;
      }
    }

    const total = totalScansResult[0].count;
    const healthPercentage = total > 0 ? Math.round((sehat / total) * 100) : 100;

    return NextResponse.json({
      success: true,
      data: {
        totalScans: total,
        healthPercentage,
        chartData: [
          { label: 'Sehat', value: sehat },
          { label: 'Terdeteksi', value: sakit }
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching mobile scan stats:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
