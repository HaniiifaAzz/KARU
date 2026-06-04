'use server';

import { DashboardRepository } from '@/lib/repositories/dashboard.repository';
import { GeminiService } from '@/lib/services/gemini.service';

const dashboardRepo = new DashboardRepository();
const geminiService = new GeminiService();

/**
 * Mengambil kompilasi metrik untuk dasbor umum
 */
export async function getDashboardSummaryAction() {
  try {
    const summary = await dashboardRepo.getSummaryMetrics();
    return { success: true, data: summary };
  } catch (error: any) {
    console.error('Error fetching dashboard summary:', error);
    return { success: false, error: error.message || 'Gagal memuat metrik dasbor.' };
  }
}

/**
 * Meminta panduan/insight AI eksekutif dari Gemini berdasarkan data terkini
 */
export async function generateAiDashboardInsightAction() {
  try {
    // 1. Ambil data metrik saat ini sebagai konteks sistem
    const summary = await dashboardRepo.getSummaryMetrics();
    
    // 2. Format string konteks yang rapi
    const contextStr = `
- Total Ruang Kerja terdaftar: ${summary.totalWorkspaces} lahan.
- Total Node QR fisik berstatus Online: ${summary.activeNodesCount} unit.
- Total Riwayat Log Pemindaian AI: ${summary.totalScans} pindaian.
- Proporsi Sebaran AI Scan: Penyakit (${summary.distribution.penyakit}), Hama (${summary.distribution.hama}), Sehat/Normal (${summary.distribution.sehat}).
- Total Dokumen SOP Aktif: ${summary.totalSops} prosedur.
`;

    // 3. Umpankan ke Gemini
    const insightHtml = await geminiService.generateExecutiveInsight(contextStr);

    return { success: true, data: insightHtml };
  } catch (error: any) {
    console.error('Error generating AI insight action:', error);
    return {
      success: false,
      error: error.message || 'Gagal menyusun panduan AI.',
      data: '<p>Koneksi ke asisten AI sedang sibuk. Silakan coba beberapa saat lagi.</p>'
    };
  }
}
