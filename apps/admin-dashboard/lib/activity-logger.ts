import { ActivityLogRepository } from './repositories/activity-log.repository';
import { auth } from './auth';
import { headers } from 'next/headers';

const activityLogRepo = new ActivityLogRepository();

export async function logActivity({
  type,
  action,
  description,
  userId,
  userName,
  userRole,
}: {
  type: 'create' | 'update' | 'delete' | 'system' | 'auth';
  action: string;
  description: string;
  userId?: string;
  userName?: string;
  userRole?: string;
}) {
  try {
    let finalUserId = userId;
    let finalUserName = userName;
    let finalUserRole = userRole;

    // If user info not provided, try to get from session
    if (!finalUserId) {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session) {
        finalUserId = session.user.id;
        finalUserName = session.user.name;
        finalUserRole = (session.user as any).role || 'pengguna';
      }
    }

    const headerList = await headers();
    const ipAddress = headerList.get('x-forwarded-for') || '127.0.0.1';

    await activityLogRepo.create({
      type,
      action,
      description,
      userId: finalUserId,
      userName: finalUserName,
      userRole: finalUserRole,
      ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0] : '127.0.0.1',
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
