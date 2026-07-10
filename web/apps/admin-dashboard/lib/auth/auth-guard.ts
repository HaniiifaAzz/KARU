import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { session, user } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function getMobileUser() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return null;
    }

    // Cari session di database berdasarkan token
    const result = await db
      .select({
        user: user
      })
      .from(session)
      .innerJoin(user, eq(session.userId, user.id))
      .where(
        and(
          eq(session.token, token),
          gt(session.expiresAt, new Date()) // pastikan belum expired
        )
      )
      .limit(1);

    if (result.length > 0) {
      return result[0].user;
    }
    
    return null;
  } catch (error) {
    console.error('Error in auth guard:', error);
    return null;
  }
}
