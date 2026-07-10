import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    await sql`ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "admin_whatsapp" varchar(50);`;
    console.log('Added admin_whatsapp column.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await sql.end();
  }
}
main();
