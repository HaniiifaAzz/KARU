import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { aiScanLogs, user, workspaces, pestsDiseases } from '../db/schema';

export class AiScanRepository {
  /**
   * Menyimpan log pindaian AI
   * location: format tuple [lng, lat]
   */
  async saveScanLog(data: {
    userId: string;
    workspaceId: string;
    qrNodeId?: string; // Opsional
    location: [number, number];
    imageUrl?: string;
    validationStatus: string;
    diagnosisResult: string;
    probability: number;
    diseaseId?: string;
  }) {
    // Karena custom types mengubah [lng,lat] -> driver format (POINT(lng lat)) otomatis
    const res = await db.insert(aiScanLogs).values({
      userId: data.userId,
      workspaceId: data.workspaceId,
      qrNodeId: data.qrNodeId,
      location: data.location as [number, number],
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
