'use server';

import { revalidatePath } from 'next/cache';
import { MasterDataService } from '@/lib/services/master-data.service';
import { logActivity } from '@/lib/activity-logger';
import fs from 'fs';
import path from 'path';

const service = new MasterDataService();

/**
 * Utility untuk menyimpan file upload secara lokal.
 * Akan menyimpan ke public/uploads/master-data/...
 */
async function saveMediaLocally(file: File, folder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Buat direktori jika belum ada
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'master-data', folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Generate nama file unik
  const extension = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1000)}.${extension}`;
  const filePath = path.join(uploadDir, fileName);

  fs.writeFileSync(filePath, buffer);

  // Return URL relatif yang bisa diakses dari browser
  return `/uploads/master-data/${folder}/${fileName}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// KAMUS TANAMAN
// ─────────────────────────────────────────────────────────────────────────────

export async function savePlantAction(formData: FormData) {
  try {
    const id = formData.get('id') as string | null;
    const namaLokal = formData.get('namaLokal') as string;
    const namaIlmiah = formData.get('namaIlmiah') as string;
    const kategori = formData.get('kategori') as string;
    const risikoPenyakit = formData.get('risikoPenyakit') as string;
    const siklusPanen = formData.get('siklusPanen') as string;
    const habitat = formData.get('habitat') as string;
    const deskripsi = formData.get('deskripsi') as string;
    
    // File upload
    const fotoFile = formData.get('fotoFile') as File | null;
    let fotoUrl = formData.get('fotoUrl') as string | null;

    if (fotoFile && fotoFile.size > 0) {
      fotoUrl = await saveMediaLocally(fotoFile, 'tanaman');
    }

    // Relasi (Hama/Penyakit)
    const pestIdsStr = formData.get('pestIds') as string | null;
    let pestIds: string[] = [];
    try {
      if (pestIdsStr) pestIds = JSON.parse(pestIdsStr);
    } catch (e) {
      console.error('Error parsing pestIds JSON:', e);
    }

    const data = {
      namaLokal,
      namaIlmiah,
      kategori,
      risikoPenyakit,
      siklusPanen,
      habitat,
      deskripsi,
      foto: fotoUrl || undefined,
    };

    let savedId = id;
    if (id && id.trim() !== '') {
      // Update
      await service.updatePlant(id, data);
    } else {
      // Create
      savedId = `T-${Date.now().toString().slice(-6)}`;
      await service.createPlant({ id: savedId, ...data });
    }

    if (savedId) {
      await service.updatePlantPestRelations(savedId, pestIds);
    }

    // Catat Log Aktivitas
    await logActivity({
      type: id && id.trim() !== '' ? 'update' : 'create',
      action: id && id.trim() !== '' ? 'Pembaruan Tanaman' : 'Penambahan Tanaman',
      description: `${id && id.trim() !== '' ? 'Memperbarui' : 'Menambahkan'} data tanaman "${namaLokal}" ke kamus sistem.`,
    });

    revalidatePath('/dashboard/data-master/kamus-tanaman');
    return { success: true };
  } catch (error: any) {
    console.error('Error in savePlantAction:', error);
    return { success: false, error: error.message };
  }
}

export async function deletePlantAction(id: string) {
  try {
    await service.deletePlant(id);

    // Catat Log Aktivitas
    await logActivity({
      type: 'delete',
      action: 'Penghapusan Tanaman',
      description: `Menghapus data tanaman dengan ID #${id} dari kamus sistem.`,
    });

    revalidatePath('/dashboard/data-master/kamus-tanaman');
    return { success: true };
  } catch (error: any) {
    console.error('Error in deletePlantAction:', error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// KAMUS PENYAKIT & HAMA
// ─────────────────────────────────────────────────────────────────────────────

export async function savePestAction(formData: FormData) {
  try {
    const id = formData.get('id') as string | null;
    const nama = formData.get('nama') as string;
    const namaIlmiah = formData.get('namaIlmiah') as string;
    const jenis = formData.get('jenis') as string;
    const kategori = formData.get('kategori') as string;
    const tingkatRisiko = formData.get('tingkatRisiko') as string;
    const gejala = formData.get('gejala') as string;
    const penanganan = formData.get('penanganan') as string;
    
    // File upload
    const fotoFile = formData.get('fotoFile') as File | null;
    let fotoUrl = formData.get('fotoUrl') as string | null;

    if (fotoFile && fotoFile.size > 0) {
      fotoUrl = await saveMediaLocally(fotoFile, 'hama-penyakit');
    }

    // Relasi (Tanaman Inang)
    const plantIdsStr = formData.get('plantIds') as string | null;
    let plantIds: string[] = [];
    try {
      if (plantIdsStr) plantIds = JSON.parse(plantIdsStr);
    } catch (e) {
      console.error('Error parsing plantIds JSON:', e);
    }

    const data = {
      nama,
      namaIlmiah,
      jenis,
      kategori,
      tingkatRisiko,
      gejala,
      penanganan,
      foto: fotoUrl || undefined,
    };

    let savedId = id;
    if (id && id.trim() !== '') {
      // Update
      await service.updatePest(id, data);
    } else {
      // Create
      savedId = `PH-${Date.now().toString().slice(-6)}`;
      await service.createPest({ id: savedId, ...data });
    }

    if (savedId) {
      await service.updatePestPlantRelations(savedId, plantIds);
    }

    // Catat Log Aktivitas
    await logActivity({
      type: id && id.trim() !== '' ? 'update' : 'create',
      action: id && id.trim() !== '' ? 'Pembaruan Hama/Penyakit' : 'Penambahan Hama/Penyakit',
      description: `${id && id.trim() !== '' ? 'Memperbarui' : 'Menambahkan'} data ${jenis} "${nama}" ke kamus sistem.`,
    });

    revalidatePath('/dashboard/data-master/kamus-penyakit-hama');
    return { success: true };
  } catch (error: any) {
    console.error('Error in savePestAction:', error);
    return { success: false, error: error.message };
  }
}

export async function deletePestAction(id: string) {
  try {
    await service.deletePest(id);

    // Catat Log Aktivitas
    await logActivity({
      type: 'delete',
      action: 'Penghapusan Hama/Penyakit',
      description: `Menghapus data hama/penyakit dengan ID #${id} dari kamus sistem.`,
    });

    revalidatePath('/dashboard/data-master/kamus-penyakit-hama');
    return { success: true };
  } catch (error: any) {
    console.error('Error in deletePestAction:', error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GETTERS UNTUK CLIENT COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getPlantsAction() {
  const data = await service.getMasterDataCollections();
  return data.plants;
}

export async function getPestsAction() {
  const data = await service.getMasterDataCollections();
  return data.pests;
}

// ─────────────────────────────────────────────────────────────────────────────
// PANDUAN SOP
// ─────────────────────────────────────────────────────────────────────────────

export async function saveSopAction(formData: FormData) {
  try {
    const id = formData.get('id') as string | null;
    const judul = formData.get('judul') as string;
    const kategori = formData.get('kategori') as string;
    const urgensi = formData.get('urgensi') as string;
    const langkahStr = formData.get('langkah') as string;
    const pdfUrl = formData.get('pdfUrl') as string | null;

    let langkah: string[] = [];
    let plantIds: string[] = [];
    let pestIds: string[] = [];
    const plantIdsStr = formData.get('plantIds') as string | null;
    const pestIdsStr = formData.get('pestIds') as string | null;
    
    try {
      if (langkahStr) langkah = JSON.parse(langkahStr);
      if (plantIdsStr) plantIds = JSON.parse(plantIdsStr);
      if (pestIdsStr) pestIds = JSON.parse(pestIdsStr);
    } catch (e) {
      console.error('Error parsing JSON:', e);
    }

    const data = {
      judul,
      kategori,
      urgensi,
      langkah,
      pdfUrl: pdfUrl || null,
    };

    let savedId = id;
    if (id && id.trim() !== '') {
      await service.updateSop(id, data);
    } else {
      savedId = `SOP-${Date.now().toString().slice(-6)}`;
      await service.createSop({ id: savedId, ...data });
    }

    if (savedId) {
      await service.updateSopRelations(savedId, plantIds, pestIds);
    }

    // Catat Log Aktivitas
    await logActivity({
      type: id && id.trim() !== '' ? 'update' : 'create',
      action: id && id.trim() !== '' ? 'Pembaruan SOP' : 'Penambahan SOP',
      description: `${id && id.trim() !== '' ? 'Memperbarui' : 'Menambahkan'} dokumen SOP "${judul}" (${kategori}) ke sistem.`,
    });

    revalidatePath('/dashboard/data-master/sop-penanganan');
    return { success: true };
  } catch (error: any) {
    console.error('Error in saveSopAction:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteSopAction(id: string) {
  try {
    await service.deleteSop(id);

    // Catat Log Aktivitas
    await logActivity({
      type: 'delete',
      action: 'Penghapusan SOP',
      description: `Menghapus dokumen SOP dengan ID #${id} dari sistem secara permanen.`,
    });

    revalidatePath('/dashboard/data-master/sop-penanganan');
    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteSopAction:', error);
    return { success: false, error: error.message };
  }
}

export async function getSopsAction() {
  const data = await service.getMasterDataCollections();
  return data.sops;
}
