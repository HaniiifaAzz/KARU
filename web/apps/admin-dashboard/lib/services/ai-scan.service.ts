import fs from 'fs/promises';
import path from 'path';
import { or, ilike } from 'drizzle-orm';
import { db } from '../db';
import { pestsDiseases } from '../db/schema';
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { AiScanRepository } from '../repositories/ai-scan.repository';
import { GeminiService, type GeminiDiagnosis } from './gemini.service';

export class AiScanService {
  private workspaceRepo: WorkspaceRepository;
  private scanRepo: AiScanRepository;
  private geminiService: GeminiService;

  constructor() {
    this.workspaceRepo = new WorkspaceRepository();
    this.scanRepo = new AiScanRepository();
    this.geminiService = new GeminiService();
  }

  /**
   * Helper untuk membaca gambar menjadi base64 (mendukung file lokal maupun URL Supabase)
   */
  private async getImageBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const res = await fetch(imageUrl);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = res.headers.get('content-type') || 'image/jpeg';
      return { base64: buffer.toString('base64'), mimeType };
    } else {
      // Skenario file lokal di /public/uploads/scans/
      // Hapus prefix / jika ada agar path resolusi aman
      const relativePath = imageUrl.replace(/^\/+/, '');
      const filePath = path.join(process.cwd(), 'public', relativePath);
      const buffer = await fs.readFile(filePath);
      const ext = path.extname(imageUrl).toLowerCase();
      let mimeType = 'image/jpeg';
      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.webp') mimeType = 'image/webp';
      return { base64: buffer.toString('base64'), mimeType };
    }
  }

  /**
   * Mencocokkan hasil AI dengan tabel master data pestsDiseases
   */
  private async matchDiseaseFromAI(diagnosisResult: string, namaIlmiah: string | null) {
    const conditions = [ilike(pestsDiseases.nama, `%${diagnosisResult}%`)];
    if (namaIlmiah) {
      conditions.push(ilike(pestsDiseases.namaIlmiah, `%${namaIlmiah}%`));
    }

    const match = await db
      .select()
      .from(pestsDiseases)
      .where(or(...conditions))
      .limit(1);

    return match.length > 0 ? match[0].id : null;
  }

  /**
   * Method utama saat Mobile App mengirimkan log pindaian hama
   */
  async processIncomingScan(userId: string, data: any) {
    const { workspaceId, qrNodeId, lng, lat, imageUrl } = data;

    // 1. Validasi Input Dasar
    if (!workspaceId || lng === undefined || lat === undefined) {
      throw new Error('Data scan tidak lengkap. Diperlukan workspaceId, lng, dan lat.');
    }

    // Tentukan parameter diagnosis akhir (mendukung override dari operator maupun input legacy)
    let finalDiagnosis = data.overrideDiagnosis || data.diagnosisResult;
    let finalProbability = data.overrideProbability ?? data.probability;
    let finalDiseaseId = data.overrideDiseaseId || data.diseaseId;
    let aiDiagnosisDetails: any = null;

    // Jika belum ada diagnosis akhir dari client dan gambar tersedia, jalankan Gemini AI
    if (!finalDiagnosis && imageUrl) {
      try {
        const { base64, mimeType } = await this.getImageBase64(imageUrl);
        const aiResult = await this.geminiService.diagnosePlantImage(base64, mimeType);

        finalDiagnosis = aiResult.diagnosisResult;
        finalProbability = aiResult.probability;
        finalDiseaseId = await this.matchDiseaseFromAI(aiResult.diagnosisResult, aiResult.namaIlmiah);
        aiDiagnosisDetails = {
          ...aiResult,
          wasOverridden: false,
        };
      } catch (err: any) {
        console.error('Gagal menjalankan Gemini AI diagnosis:', err);
        finalDiagnosis = 'Analisis Gagal';
        finalProbability = 0;
        aiDiagnosisDetails = {
          diagnosisResult: finalDiagnosis,
          probability: 0,
          category: 'Sehat',
          recommendation: 'Silakan isi diagnosis manual.',
          wasOverridden: false,
        };
      }
    } else if (finalDiagnosis) {
      // Jika disubmit manual/override, coba match ke master data jika diseaseId kosong
      if (!finalDiseaseId) {
        finalDiseaseId = await this.matchDiseaseFromAI(finalDiagnosis, null);
      }
      aiDiagnosisDetails = {
        diagnosisResult: finalDiagnosis,
        probability: finalProbability || 0,
        category: 'Penyakit',
        recommendation: 'Diagnosis manual/override oleh operator.',
        wasOverridden: true,
      };
    }

    // Pastikan finalDiagnosis tidak kosong
    if (!finalDiagnosis) {
      finalDiagnosis = 'Tanpa Diagnosis';
      finalProbability = 0;
    }

    // 2. Cek Geofence Validation: Point in Polygon
    const isInside = await this.workspaceRepo.isPointInsideWorkspace(workspaceId, lng, lat);
    const validationStatus = isInside ? 'Valid' : 'Di Luar Batas';

    // 3. Simpan ke database
    const logId = await this.scanRepo.saveScanLog({
      userId,
      workspaceId,
      qrNodeId: qrNodeId || undefined,
      location: [lng, lat],
      imageUrl,
      validationStatus,
      diagnosisResult: finalDiagnosis,
      probability: finalProbability || 0,
      diseaseId: finalDiseaseId || undefined,
    });

    return {
      success: true,
      logId,
      validationStatus,
      message: isInside
        ? 'Data diverifikasi valid di dalam zona lahan.'
        : 'PERINGATAN: Posisi scan Anda terdeteksi di luar batas poligon lahan.',
      aiDiagnosis: aiDiagnosisDetails,
    };
  }
}
