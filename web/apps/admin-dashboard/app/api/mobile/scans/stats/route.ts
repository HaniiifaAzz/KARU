import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiScanLogs, pestsDiseases } from '@/lib/db/schema';
import { eq, count, sql } from 'drizzle-orm';
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

    const total = totalScansResult[0].count;

    // Join dengan pestsDiseases untuk mendapatkan jenis (Penyakit / Hama)
    const detailStats = await db
      .select({
        diagnosisResult: aiScanLogs.diagnosisResult,
        jenis: pestsDiseases.jenis,
        count: count()
      })
      .from(aiScanLogs)
      .leftJoin(pestsDiseases, eq(aiScanLogs.diseaseId, pestsDiseases.id))
      .where(eq(aiScanLogs.userId, user.id))
      .groupBy(aiScanLogs.diagnosisResult, pestsDiseases.jenis);

    let sehat = 0;
    let penyakit = 0;
    let hama = 0;

    for (const row of detailStats) {
      const diag = (row.diagnosisResult || '').toLowerCase();
      const isHealthy = diag.includes('sehat') || diag.includes('normal');
      
      if (isHealthy) {
        sehat += row.count;
      } else if (row.jenis === 'Hama') {
        hama += row.count;
      } else {
        // Default: anggap Penyakit jika tidak bisa dibedakan
        penyakit += row.count;
      }
    }

    const healthPercentage = total > 0 ? Math.round((sehat / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalScans: total,
        healthPercentage,
        chartData: [
          { label: 'Sehat', value: sehat },
          { label: 'Penyakit', value: penyakit },
          { label: 'Hama', value: hama },
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching mobile scan stats:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
