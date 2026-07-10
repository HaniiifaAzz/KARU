import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mobileBanners } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { getMobileUser } from '@/lib/auth/auth-guard';

export async function GET() {
  try {
    const user = await getMobileUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const banners = await db
      .select()
      .from(mobileBanners)
      .where(eq(mobileBanners.isActive, true))
      .orderBy(asc(mobileBanners.displayOrder));

    return NextResponse.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Error fetching mobile banners:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
