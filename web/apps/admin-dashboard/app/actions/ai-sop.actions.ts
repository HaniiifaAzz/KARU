'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

// Inisialisasi Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface GenerateSopParams {
  judul: string;
  kategori: string;
  tanaman: string[];
  penyakitHama: string[];
}

export async function generateSopStepsAction(params: GenerateSopParams) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY tidak ditemukan di environment variables.');
    }

    if (!params.judul) {
      throw new Error('Judul SOP wajib diisi untuk menggunakan AI.');
    }

    // Menggunakan model flash untuk kecepatan optimal
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const tanamanStr = params.tanaman.length > 0 ? params.tanaman.join(', ') : 'Umum (Tidak spesifik)';
    const hamaStr = params.penyakitHama.length > 0 ? params.penyakitHama.join(', ') : 'Umum (Tidak spesifik)';

    const prompt = `Anda adalah ahli pertanian, perkebunan, dan patologi tanaman.
Tugas Anda adalah membuat langkah-langkah Standar Operasional Prosedur (SOP) penanganan lapangan.

Detail SOP:
- Judul: ${params.judul}
- Kategori: ${params.kategori}
- Tanaman Target: ${tanamanStr}
- Hama/Penyakit Terkait: ${hamaStr}

Berikan instruksi operasional yang logis, praktis, profesional, dan dapat ditindaklanjuti secara berurutan.
Output HARUS murni berupa valid JSON array of strings, tanpa markdown formatting (\`\`\`json) dan tanpa teks pembuka/penutup.
Contoh format output yang BENAR:
["Gunakan APD lengkap sebelum memasuki area terinfeksi.", "Lakukan isolasi tanaman dengan radius 5 meter.", "Aplikasikan fungisida secara merata di pangkal batang."]`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Membersihkan sisa markdown jika model masih membandel memberikan format markdown
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    const steps = JSON.parse(text);

    if (!Array.isArray(steps)) {
      throw new Error('Format balasan AI tidak sesuai (bukan array).');
    }

    // Memastikan tidak ada teks kosong
    const validSteps = steps.filter((step: any) => typeof step === 'string' && step.trim().length > 0);

    return { success: true, data: validSteps };
  } catch (error: any) {
    console.error('Error generating SOP with AI:', error);
    return { success: false, error: error.message || 'Terjadi kesalahan saat memanggil AI.' };
  }
}
