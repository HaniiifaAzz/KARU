import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiScanLogs, pestsDiseases, workspaces } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getMobileUser } from '@/lib/auth/auth-guard';

export async function GET(req: Request) {
  try {
    const user = await getMobileUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    const history = await db
      .select({
        id: aiScanLogs.id,
        imageUrl: aiScanLogs.imageUrl,
        validationStatus: aiScanLogs.validationStatus,
        diagnosisResult: aiScanLogs.diagnosisResult,
        probability: aiScanLogs.probability,
        scannedAt: aiScanLogs.scannedAt,
        disease: {
          id: pestsDiseases.id,
          nama: pestsDiseases.nama,
          jenis: pestsDiseases.jenis,     // 'Penyakit' atau 'Hama'
          kategori: pestsDiseases.kategori,
          penanganan: pestsDiseases.penanganan
        },
        workspace: {
          id: workspaces.id,
          name: workspaces.name
        }
      })
      .from(aiScanLogs)
      .leftJoin(pestsDiseases, eq(aiScanLogs.diseaseId, pestsDiseases.id))
      .leftJoin(workspaces, eq(aiScanLogs.workspaceId, workspaces.id))
      .where(eq(aiScanLogs.userId, user.id))
      .orderBy(desc(aiScanLogs.scannedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: history,
      meta: {
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching mobile scan history:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
