import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getMobileUser } from '@/lib/auth/auth-guard';

export async function PUT(req: Request) {
  try {
    const authUser = await getMobileUser();
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, image } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (image) updateData.image = image;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'No data to update' }, { status: 400 });
    }

    updateData.updatedAt = new Date();

    const result = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, authUser.id))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: result[0]
    });
  } catch (error) {
    console.error('Error updating mobile user profile:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
