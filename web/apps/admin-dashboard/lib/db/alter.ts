import { db } from './index';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

async function main() {
  console.log("Menambahkan kolom ke ai_scan_logs...");
  try {
    await db.execute(sql`ALTER TABLE "ai_scan_logs" ADD COLUMN IF NOT EXISTS "ai_category" varchar(50);`);
    await db.execute(sql`ALTER TABLE "ai_scan_logs" ADD COLUMN IF NOT EXISTS "ai_recommendation" text;`);
    await db.execute(sql`ALTER TABLE "ai_scan_logs" ADD COLUMN IF NOT EXISTS "ai_description" text;`);
    console.log("Berhasil menambahkan kolom aiCategory, aiRecommendation, aiDescription.");
  } catch (error) {
    console.error("Gagal mengubah tabel:", error);
  } finally {
    process.exit(0);
  }
}

main();
