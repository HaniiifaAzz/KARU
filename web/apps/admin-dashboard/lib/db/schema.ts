import { pgTable, text, timestamp, varchar, integer, serial, jsonb, boolean, geometry } from 'drizzle-orm/pg-core';

/* =========================================================================
   1. AUTHENTICATION (BetterAuth Base - Minimal required representation)
   (Catatan: BetterAuth bisa auto-generate ini via CLI, ini definisi dasar agar relasi jalan)
========================================================================= */
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("emailVerified").notNull(),
	image: text("image"),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull(),
  role: text('role').default('pengguna'),
  phone: text('phone'),
  status: varchar('status', { length: 50 }).default('Aktif'),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expiresAt").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId").notNull().references(() => user.id, { onDelete: 'cascade' })
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId").notNull().references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
	refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull()
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expiresAt").notNull(),
	createdAt: timestamp("createdAt"),
	updatedAt: timestamp("updatedAt")
});

/* =========================================================================
   2. DATA MASTER (Tanaman, Penyakit/Hama, SOP)
========================================================================= */
export const plants = pgTable('plants', {
  id: varchar('id', { length: 20 }).primaryKey(),
  namaLokal: varchar('nama_lokal', { length: 255 }).notNull(),
  namaIlmiah: varchar('nama_ilmiah', { length: 255 }),
  kategori: varchar('kategori', { length: 100 }),
  risikoPenyakit: varchar('risiko_penyakit', { length: 50 }),
  siklusPanen: varchar('siklus_panen', { length: 100 }),
  habitat: varchar('habitat', { length: 255 }),
  deskripsi: text('deskripsi'),
  foto: text('foto'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const pestsDiseases = pgTable('pests_diseases', {
  id: varchar('id', { length: 20 }).primaryKey(),
  nama: varchar('nama', { length: 255 }).notNull(),
  namaIlmiah: varchar('nama_ilmiah', { length: 255 }),
  jenis: varchar('jenis', { length: 50 }), // Penyakit / Hama
  kategori: varchar('kategori', { length: 100 }),
  tingkatRisiko: varchar('tingkat_risiko', { length: 50 }),
  gejala: text('gejala'),
  penanganan: text('penanganan'),
  foto: text('foto'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relasi Many-to-Many Tanaman <--> Penyakit/Hama (Tanaman Inang)
export const plantPestRelations = pgTable('plant_pest_relations', {
  id: serial('id').primaryKey(),
  plantId: varchar('plant_id', { length: 20 }).references(() => plants.id, { onDelete: 'cascade' }),
  pestDiseaseId: varchar('pest_disease_id', { length: 20 }).references(() => pestsDiseases.id, { onDelete: 'cascade' }),
});

export const sops = pgTable('sops', {
  id: varchar('id', { length: 20 }).primaryKey(),
  judul: varchar('judul', { length: 255 }).notNull(),
  kategori: varchar('kategori', { length: 100 }),
  urgensi: varchar('urgensi', { length: 50 }),
  langkah: jsonb('langkah').notNull(), // Menyimpan array string
  pdfUrl: text('pdf_url'),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relasi Many-to-Many SOP <--> Tanaman (SOP spesifik tanaman)
export const sopPlantRelations = pgTable('sop_plant_relations', {
  id: serial('id').primaryKey(),
  sopId: varchar('sop_id', { length: 20 }).references(() => sops.id, { onDelete: 'cascade' }),
  plantId: varchar('plant_id', { length: 20 }).references(() => plants.id, { onDelete: 'cascade' }),
});

// Relasi Many-to-Many SOP <--> Penyakit/Hama (SOP penanganan Hama tertentu)
export const sopPestRelations = pgTable('sop_pest_relations', {
  id: serial('id').primaryKey(),
  sopId: varchar('sop_id', { length: 20 }).references(() => sops.id, { onDelete: 'cascade' }),
  pestDiseaseId: varchar('pest_disease_id', { length: 20 }).references(() => pestsDiseases.id, { onDelete: 'cascade' }),
});

/* =========================================================================
   3. WORKSPACE & GEOFENCING
========================================================================= */
export const workspaces = pgTable('workspaces', {
  id: varchar('id', { length: 20 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }), // Makro / Mikro
  status: varchar('status', { length: 50 }).default('Perencanaan'),
  priority: varchar('priority', { length: 50 }),
  description: text('description'),
  areaInfo: varchar('area_info', { length: 100 }),
  image: text('image'),
  assignedUserId: text('assigned_user_id').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Geofencing Boundaries
export const geofences = pgTable('geofences', {
  id: serial('id').primaryKey(),
  workspaceId: varchar('workspace_id', { length: 20 }).references(() => workspaces.id, { onDelete: 'cascade' }),
  polygonInfo: geometry('polygon_info', { type: 'polygon', mode: 'tuple', srid: 4326 }).notNull(),
});

/* =========================================================================
   4. QR NODES
========================================================================= */
export const qrBatches = pgTable('qr_batches', {
  id: varchar('id', { length: 50 }).primaryKey(),
  workspaceId: varchar('workspace_id', { length: 20 }).references(() => workspaces.id),
  zone: varchar('zone', { length: 255 }),
  nodeCount: integer('node_count').notNull(),
  prefix: varchar('prefix', { length: 50 }),
  status: varchar('status', { length: 50 }).default('Belum Dicetak'),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const qrNodes = pgTable('qr_nodes', {
  id: varchar('id', { length: 100 }).primaryKey(),
  batchId: varchar('batch_id', { length: 50 }).references(() => qrBatches.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).default('Offline'),
  lastScannedAt: timestamp('last_scanned_at'),
});

/* =========================================================================
   5. AI SCAN LOGS
========================================================================= */
export const aiScanLogs = pgTable('ai_scan_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  workspaceId: varchar('workspace_id', { length: 20 }).references(() => workspaces.id),
  qrNodeId: varchar('qr_node_id', { length: 100 }).references(() => qrNodes.id), // Opsional
  location: geometry('location', { type: 'point', mode: 'tuple', srid: 4326 }).notNull(),
  imageUrl: text('image_url'),
  validationStatus: varchar('validation_status', { length: 50 }), // Valid / Di Luar Batas
  diagnosisResult: varchar('diagnosis_result', { length: 255 }),
  diseaseId: varchar('disease_id', { length: 20 }).references(() => pestsDiseases.id), // Link hasil analisis ke Master Data
  probability: integer('probability'), // 0 - 100
  scannedAt: timestamp('scanned_at').defaultNow(),
});

/* =========================================================================
   6. ACTIVITY / AUDIT LOGS
========================================================================= */
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 50 }).notNull(), // create, update, delete, system, auth
  action: varchar('action', { length: 255 }).notNull(),
  description: text('description').notNull(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  userRole: varchar('user_role', { length: 100 }),
  userName: varchar('user_name', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/* =========================================================================
   7. SYSTEM SETTINGS (CMS)
========================================================================= */
export const systemSettings = pgTable('system_settings', {
  id: integer('id').primaryKey().default(1),
  siteName: varchar('site_name', { length: 255 }).default('KARU'),
  siteDescription: text('site_description'),
  logoUrl: text('logo_url'),
  faviconUrl: text('favicon_url'),
  footerText: text('footer_text'),
  contactEmail: varchar('contact_email', { length: 255 }),
  maintenanceMode: boolean('maintenance_mode').default(false),
  updatedAt: timestamp('updated_at').defaultNow(),
});
