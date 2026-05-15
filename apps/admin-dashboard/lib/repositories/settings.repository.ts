import { eq } from 'drizzle-orm';
import { db } from '../db';
import { systemSettings } from '../db/schema';

export type SystemSettingsInsert = typeof systemSettings.$inferInsert;
export type SystemSettingsSelect = typeof systemSettings.$inferSelect;

export class SettingsRepository {
  /**
   * Mengambil pengaturan sistem saat ini.
   * Jika belum ada, buat entri default.
   */
  async getSettings(): Promise<SystemSettingsSelect> {
    let settings = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.id, 1),
    });

    if (!settings) {
      const [newSettings] = await db.insert(systemSettings).values({ id: 1 }).returning();
      return newSettings;
    }

    return settings;
  }

  /**
   * Memperbarui pengaturan sistem.
   */
  async updateSettings(data: Partial<SystemSettingsInsert>) {
    const [result] = await db
      .update(systemSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(systemSettings.id, 1))
      .returning();
    return result;
  }
}
