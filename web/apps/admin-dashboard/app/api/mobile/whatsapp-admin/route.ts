import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { systemSettings } from '@/lib/db/schema';

export async function GET() {
  try {
    const settings = await db
      .select({
        adminWhatsapp: systemSettings.adminWhatsapp
      })
      .from(systemSettings)
      .limit(1);

    const whatsappNumber = settings.length > 0 ? settings[0].adminWhatsapp : null;

    return NextResponse.json({
      success: true,
      data: {
        whatsappNumber
      }
    });
  } catch (error) {
    console.error('Error fetching admin whatsapp:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
