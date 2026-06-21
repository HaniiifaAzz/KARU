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

export async function generatePlantInfoAction(namaLokal: string) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY tidak ditemukan di environment variables.');
    }

    if (!namaLokal) {
      throw new Error('Nama lokal tanaman wajib diisi.');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Anda adalah ahli botani dan pertanian. Berikan informasi teknis mengenai tanaman "${namaLokal}".
Output HARUS murni berupa valid JSON object, tanpa markdown formatting (\`\`\`json) dan tanpa teks pembuka/penutup.
Format output JSON yang BENAR:
{
  "namaIlmiah": "Nama ilmiah/latin dari tanaman ini",
  "siklusPanen": "Estimasi waktu siklus panen (contoh: 3-4 Bulan, 1 Tahun, dll)",
  "deskripsi": "Deskripsi singkat dan informatif mengenai tanaman ini, karakteristiknya, dan kegunaannya (maksimal 3-4 kalimat)."
}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    const data = JSON.parse(text);

    return { success: true, data };
  } catch (error: any) {
    console.error('Error generating plant info with AI:', error);
    return { success: false, error: error.message || 'Terjadi kesalahan saat memanggil AI.' };
  }
}

export async function generatePestInfoAction(namaUmum: string, kategoriOptions: string[]) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY tidak ditemukan di environment variables.');
    }

    if (!namaUmum) {
      throw new Error('Nama umum penyakit/hama wajib diisi.');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Anda adalah ahli patologi tanaman dan entomologi. Berikan informasi teknis mengenai penyakit/hama "${namaUmum}".
Kategori ilmiah harus dipilih SALAH SATU dari pilihan berikut (harus sama persis): [${kategoriOptions.join(', ')}].
Cara pengendalian harus berupa teks deskriptif (paragraf pendek), bukan urutan langkah operasional SOP.

Output HARUS murni berupa valid JSON object, tanpa markdown formatting (\`\`\`json) dan tanpa teks pembuka/penutup.
Format output JSON yang BENAR:
{
  "namaIlmiah": "Nama ilmiah/latin dari hama/penyakit ini",
  "kategori": "Pilih salah satu kategori ilmiah persis seperti opsi yang diberikan",
  "gejala": "Deskripsi ciri-ciri yang terlihat secara visual pada tanaman yang diserang (maks 3 kalimat)",
  "penanganan": "Cara pengendalian dan pencegahan secara deskriptif (maks 3-4 kalimat)"
}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    const data = JSON.parse(text);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error generating pest info with AI:', error);
    return { success: false, error: error.message || 'Terjadi kesalahan saat memanggil AI.' };
  }
}
