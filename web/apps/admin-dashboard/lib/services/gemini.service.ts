import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Tipe hasil diagnosis ────────────────────────────────────────────────────────
export interface GeminiDiagnosis {
  isHealthy: boolean;
  diagnosisResult: string;
  category: 'Penyakit' | 'Hama' | 'Sehat';
  probability: number;
  namaIlmiah: string | null;
  severity: 'Ringan' | 'Sedang' | 'Berat' | null;
  recommendation: string;
  description: string;
}

// ── Prompt ───────────────────────────────────────────────────────────────────────
const DIAGNOSIS_PROMPT = `
Kamu adalah ahli fitopatologi (penyakit tanaman) dan entomologi (serangga hama).
Analisis gambar tanaman berikut dan berikan diagnosis dalam format JSON.

Aturan:
1. Identifikasi apakah tanaman sehat atau ada masalah
2. Jika ada penyakit/hama, identifikasi nama dan jenisnya
3. Berikan tingkat keyakinan (0-100)
4. Berikan rekomendasi penanganan singkat
5. Respond dalam Bahasa Indonesia

Format JSON yang WAJIB dikembalikan (tanpa markdown code block, hanya JSON murni):
{
  "isHealthy": boolean,
  "diagnosisResult": "string — nama penyakit/hama atau 'Tanaman Sehat'",
  "category": "Penyakit" | "Hama" | "Sehat",
  "probability": number (0-100),
  "namaIlmiah": "string — nama ilmiah jika terdeteksi, null jika sehat",
  "severity": "Ringan" | "Sedang" | "Berat" | null,
  "recommendation": "string — saran penanganan singkat",
  "description": "string — penjelasan detail temuan"
}
`;

// ── Service ──────────────────────────────────────────────────────────────────────
export class GeminiService {
  private model;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY belum diatur di .env');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });
  }

  /**
   * Analisis gambar tanaman dan kembalikan diagnosis terstruktur.
   * @param imageBase64 - Gambar dalam format base64 (tanpa prefix data:image/...)
   * @param mimeType - MIME type gambar (image/jpeg, image/png, dll.)
   */
  async diagnosePlantImage(
    imageBase64: string,
    mimeType: string
  ): Promise<GeminiDiagnosis> {
    try {
      const result = await this.model.generateContent([
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType,
          },
        },
        { text: DIAGNOSIS_PROMPT },
      ]);

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText) as GeminiDiagnosis;

      // Pastikan probability dalam range 0-100
      parsed.probability = Math.max(0, Math.min(100, parsed.probability));

      return parsed;
    } catch (error: any) {
      console.error('Gemini diagnosis error:', error);

      // Fallback response jika AI gagal
      return {
        isHealthy: true,
        diagnosisResult: 'Analisis Gagal',
        category: 'Sehat',
        probability: 0,
        namaIlmiah: null,
        severity: null,
        recommendation: 'Silakan lakukan diagnosis manual.',
        description: `AI tidak dapat menganalisis gambar: ${error.message}`,
      };
    }
  }

  /**
   * Menghasilkan panduan eksekutif berbasis teks untuk dasbor umum.
   */
  async generateExecutiveInsight(statsContext: string): Promise<string> {
    try {
      // Kita buat instance model teks murni tanpa batasan JSON
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const textModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `
Kamu adalah Penasihat Ahli Ekologis dan Agronomi Utama untuk platform KARU.
Berdasarkan data metrik sistem waktu nyata berikut:
${statsContext}

Berikan ringkasan panduan eksekutif cerdas dalam 2 paragraf singkat bergaya profesional untuk Administrator dasbor.
Fokuskan pada:
1. Interpretasi kesehatan dan sebaran pindaian (Penyakit vs Hama vs Sehat).
2. Rekomendasi tindakan strategis untuk mengoptimalkan operasional dan node sensor.
Gunakan Bahasa Indonesia yang baku, profesional, dan menyertakan tag HTML ringan seperti <strong> untuk penekanan sektor/kata kunci penting (TANPA markdown, kembalikan murni string berformat HTML snippet ringan yang siap di-render).
`;

      const result = await textModel.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.error('Gemini executive insight error:', error);
      return '<p>Sistem AI saat ini mengalami keterlambatan respons. <strong>Rekomendasi default:</strong> Lakukan peninjauan berkala pada log pindaian dengan status <em>Di Luar Batas</em> serta kalibrasi ulang stiker fisik QR yang berstatus Offline di sektor kebun prioritas tinggi.</p>';
    }
  }
}

