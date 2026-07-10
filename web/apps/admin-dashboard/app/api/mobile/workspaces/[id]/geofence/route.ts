import { NextRequest, NextResponse } from 'next/server'; // 1. Tambahkan NextRequest di sini
import { db } from '@/lib/db';
import { geofences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getMobileUser } from '@/lib/auth/auth-guard';

export async function GET(
  req: NextRequest, // 2. Ubah Request menjadi NextRequest
  { params }: { params: Promise<{ id: string }> } // 3. Bungkus params ke dalam Promise
) {
  try {
    const user = await getMobileUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Ini sudah benar
    const { id } = await params;

    const geofence = await db
      .select()
      .from(geofences)
      .where(eq(geofences.workspaceId, id))
      .limit(1);

    if (geofence.length === 0) {
      return NextResponse.json({ success: false, error: 'Geofence not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: geofence[0]
    });
  } catch (error) {
    console.error('Error fetching mobile workspace geofence:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}