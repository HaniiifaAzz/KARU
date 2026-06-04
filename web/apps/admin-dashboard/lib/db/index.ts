import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Koneksi ke PostgreSQL. Anda harus menyesuaikan DATABASE_URL di file .env Anda.
// Idealnya berisi kredensial dan database yang sudah mengaktifkan extensi postgis
const connectionString = process.env.DATABASE_URL || 'postgres://username:password@localhost:5432/karupostgis';

// Membuat client postgres
const sql = postgres(connectionString, { max: 1 });

// Inisialisasi db dengan schema yang telah kita buat
export const db = drizzle(sql, { schema });
