import { desc, ilike, or, and, eq, gte } from 'drizzle-orm';
import { db } from '../db';
import { activityLogs } from '../db/schema';

export type ActivityLogInsert = typeof activityLogs.$inferInsert;

export class ActivityLogRepository {
  /**
   * Menyimpan entri log aktivitas baru
   */
  async create(data: ActivityLogInsert) {
    const [result] = await db.insert(activityLogs).values(data).returning();
    return result;
  }

  /**
   * Mencari log yang mirip dalam 1 menit terakhir berdasarkan action dan IP Address
   */
  async findRecentSimilarLog(action: string, ipAddress: string) {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const results = await db
      .select()
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.action, action),
          eq(activityLogs.ipAddress, ipAddress),
          gte(activityLogs.createdAt, oneMinuteAgo)
        )
      )
      .orderBy(desc(activityLogs.createdAt))
      .limit(1);
    return results[0] || null;
  }

  /**
   * Mengambil log aktivitas dengan filter tipe, pencarian teks, dan paginasi
   */
  async getLogs(params?: {
    type?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const conditions = [];

    if (params?.type && params.type !== 'semua') {
      conditions.push(eq(activityLogs.type, params.type));
    }

    if (params?.search && params.search.trim() !== '') {
      const s = `%${params.search.trim()}%`;
      conditions.push(
        or(
          ilike(activityLogs.action, s),
          ilike(activityLogs.description, s),
          ilike(activityLogs.userName, s),
          ilike(activityLogs.ipAddress, s)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select()
      .from(activityLogs)
      .where(whereClause)
      .orderBy(desc(activityLogs.createdAt))
      .limit(params?.limit ?? 50)
      .offset(params?.offset ?? 0);

    return results;
  }

  /**
   * Mengambil aktivitas terbaru untuk ditampilkan di ringkasan dasbor
   */
  async getRecentLogs(limit = 5) {
    return await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }
}
