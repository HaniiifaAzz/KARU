import { db } from '../db';
import { mobileBanners } from '../db/schema';
import { eq, asc, desc } from 'drizzle-orm';

export class BannerRepository {
  async getAll() {
    return await db
      .select()
      .from(mobileBanners)
      .orderBy(asc(mobileBanners.displayOrder), desc(mobileBanners.createdAt));
  }

  async getById(id: number) {
    const results = await db
      .select()
      .from(mobileBanners)
      .where(eq(mobileBanners.id, id))
      .limit(1);
    return results[0] || null;
  }

  async create(data: typeof mobileBanners.$inferInsert) {
    const results = await db
      .insert(mobileBanners)
      .values(data)
      .returning();
    return results[0];
  }

  async update(id: number, data: Partial<typeof mobileBanners.$inferInsert>) {
    const results = await db
      .update(mobileBanners)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mobileBanners.id, id))
      .returning();
    return results[0];
  }

  async delete(id: number) {
    await db.delete(mobileBanners).where(eq(mobileBanners.id, id));
    return true;
  }
}
