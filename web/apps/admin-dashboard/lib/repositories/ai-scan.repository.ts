import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import { aiScanLogs, user, workspaces, pestsDiseases } from '../db/schema';

export class AiScanRepository {
  /**
   * Menyimpan log pindaian AI
   * location: format tuple [lng, lat] (longitude dulu, baru latitude — sesuai konvensi GeoJSON/PostGIS)
   *
   * CATATAN: postgres.js tidak bisa otomatis mengkonversi tuple JS ke geometry PostGIS.
   * Oleh karena itu, location di-insert menggunakan SQL literal ST_SetSRID(ST_MakePoint(lng, lat), 4326)
   * agar driver tidak perlu melakukan konversi apapun — PostGIS yang langsung membentuk geometry point-nya.
   */
  async saveScanLog(data: {
    userId: string;
    workspaceId: string;
    qrNodeId?: string; // Opsional
    location: [number, number]; // [longitude, latitude]
    imageUrl?: string;
    validationStatus: string;
    diagnosisResult: string;
    probability: number;
    diseaseId?: string;
  }) {
    const [lng, lat] = data.location;

    // Gunakan SQL literal agar postgres.js tidak perlu mengkonversi geometry secara otomatis.
    // ST_MakePoint(longitude, latitude) lalu di-set SRID 4326 (WGS84).
    const res = await db.insert(aiScanLogs).values({
      userId: data.userId,
      workspaceId: data.workspaceId,
      qrNodeId: data.qrNodeId,
      location: sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`,
      imageUrl: data.imageUrl,
      validationStatus: data.validationStatus,
      diagnosisResult: data.diagnosisResult,
      probability: data.probability,
      diseaseId: data.diseaseId
    }).returning({ id: aiScanLogs.id });

    return res[0].id;
  }

  /**
   * Mengambil semua log pindaian AI beserta relasi ke user, workspace, dan detail penyakit
   */
  async getAllScanLogs() {
    return await db
      .select({
        id: aiScanLogs.id,
        userId: aiScanLogs.userId,
        userName: user.name,
        workspaceId: aiScanLogs.workspaceId,
        workspaceName: workspaces.name,
        qrNodeId: aiScanLogs.qrNodeId,
        location: aiScanLogs.location,
        imageUrl: aiScanLogs.imageUrl,
        validationStatus: aiScanLogs.validationStatus,
        diagnosisResult: aiScanLogs.diagnosisResult,
        probability: aiScanLogs.probability,
        diseaseId: aiScanLogs.diseaseId,
        diseaseName: pestsDiseases.nama,
        diseaseRecommendation: pestsDiseases.penanganan,
        scannedAt: aiScanLogs.scannedAt,
      })
      .from(aiScanLogs)
      .leftJoin(user, eq(aiScanLogs.userId, user.id))
      .leftJoin(workspaces, eq(aiScanLogs.workspaceId, workspaces.id))
      .leftJoin(pestsDiseases, eq(aiScanLogs.diseaseId, pestsDiseases.id))
      .orderBy(desc(aiScanLogs.scannedAt));
  }

  /**
   * Menghapus log pindaian berdasarkan ID
   */
  async deleteScanLog(id: number) {
    return await db.delete(aiScanLogs).where(eq(aiScanLogs.id, id));
  }
}
