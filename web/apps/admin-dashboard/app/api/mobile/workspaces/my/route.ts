import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workspaces } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getMobileUser } from '@/lib/auth/auth-guard';

export async function GET() {
  try {
    const user = await getMobileUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userWorkspaces = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.assignedUserId, user.id));

    return NextResponse.json({
      success: true,
      data: userWorkspaces
    });
  } catch (error) {
    console.error('Error fetching mobile workspaces:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
