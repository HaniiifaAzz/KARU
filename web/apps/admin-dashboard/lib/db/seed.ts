import { auth } from '../auth';
import { db } from './index';
import { user } from './schema';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import 'dotenv/config';

// Memastikan Base URL ada agar auth tidak error
process.env.BETTER_AUTH_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function main() {
  console.log("Memulai proses seeding...");

  try {
    // 1. Membuat Admin Utama
    const email = "admin@karu.com";
    const password = "karuadmin2026";
    const name = "Dr. Aris Thorne";

    // Cek apakah sudah ada
    const existingAdmin = await db.select().from(user).where(eq(user.email, email)).limit(1);

    let adminId = "";

    if (existingAdmin.length === 0) {
      console.log(`Membuat akun Admin dengan email: ${email}`);
      const res = await auth.api.signUpEmail({
        body: {
          email: email,
          password,
          name,
        }
      });
      console.log("Akun berhasil dibuat. Memperbarui peran (role)...");

      // Ambil ID untuk diupdate rolenya
      const newAdmin = await db.select().from(user).where(eq(user.email, email)).limit(1);
      adminId = newAdmin[0].id;

      await db.update(user).set({ role: 'admin' }).where(eq(user.id, adminId));
      console.log("Peran pengguna berhasil diset ke Admin.");
    } else {
      console.log("Admin utama sudah ada, melewati pembuatan pengguna.");
      adminId = existingAdmin[0].id;
    }

    // 2. Data Dummy Opsional dapat disisipkan di sini.
    console.log("Seeding berhasil!");
  } catch (err) {
    console.error("Gagal melakukan seeding:", err);
  } finally {
    process.exit(0);
  }
}

main();