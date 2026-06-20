'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { QrNodeRepository } from '@/lib/repositories/qr-node.repository';
import { QrNodeService } from '@/lib/services/qr-node.service';
import { logActivity } from '@/lib/activity-logger';

const qrNodeRepo = new QrNodeRepository();
const qrNodeService = new QrNodeService();

/**
 * Mendapatkan semua batch QR Node beserta info workspace dan pembuatnya
 */
export async function getAllBatchesAction() {
  try {
    const batches = await qrNodeRepo.getAllBatches();
    return { success: true, data: batches };
  } catch (error: any) {
    console.error('Error fetching QR batches:', error);
    return { success: false, error: error.message || 'Gagal memuat data batch QR.', data: [] };
  }
}

/**
 * Mendapatkan detail sebuah batch beserta seluruh node di dalamnya
 */
export async function getBatchWithNodesAction(batchId: string) {
  try {
    const batches = await qrNodeRepo.getAllBatches();
    const batchInfo = batches.find(b => b.id === batchId);
    if (!batchInfo) {
      return { success: false, error: 'Batch tidak ditemukan.' };
    }
    const nodes = await qrNodeRepo.getNodesByBatch(batchId);
    return { success: true, batch: batchInfo, nodes };
  } catch (error: any) {
    console.error('Error fetching batch with nodes:', error);
    return { success: false, error: error.message || 'Gagal memuat detail batch.' };
  }
}

/**
 * Membuat batch baru dan men-generate QR nodes-nya
 */
export async function createBatchAction(data: {
  workspaceId: string;
  zone: string;
  nodeCount: number;
  prefix: string;
  keterangan?: string;
}) {
  try {
    // Coba dapatkan user dari sesi saat ini
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Gunakan userId dari sesi, atau fallback aman untuk development/testing jika belum login
    const createdBy = session?.user?.id || 'admin_seed_id';

    const result = await qrNodeService.generateNewBatch({
      workspaceId: data.workspaceId,
      zone: data.zone || 'Ruang Utama',
      nodeCount: data.nodeCount,
      prefix: data.prefix || 'KARU-NODE',
      createdBy,
    });

    if (result.success) {
      await logActivity({
        type: 'create',
        action: 'Pencetakan Batch QR Node',
        description: `Men-generate set batch baru berupa ${data.nodeCount} stiker QR fisik dengan prefix "${data.prefix || 'KARU-NODE'}" untuk Zona ${data.zone || 'Ruang Utama'}.`,
      });
    }

    revalidatePath('/dashboard/qr-node');
    return result;
  } catch (error: any) {
    console.error('Error creating QR batch:', error);
    return { success: false, error: error.message || 'Gagal men-generate batch QR Node.' };
  }
}

/**
 * Menghapus batch QR (termasuk seluruh nodes di dalamnya via cascade)
 */
export async function deleteBatchAction(batchId: string) {
  try {
    await qrNodeRepo.deleteBatch(batchId);

    await logActivity({
      type: 'delete',
      action: 'Penghapusan Batch QR Node',
      description: `Mencabut dan menghapus permanen set batch stiker QR ID #${batchId} dari sistem.`,
    });

    revalidatePath('/dashboard/qr-node');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting QR batch:', error);
    return { success: false, error: error.message || 'Gagal menghapus batch QR.' };
  }
}

/**
 * Mengubah status batch (misal dari 'Belum Dicetak' menjadi 'Dicetak')
 */
export async function updateBatchStatusAction(batchId: string, status: 'Dicetak' | 'Belum Dicetak') {
  try {
    await qrNodeRepo.updateBatchStatus(batchId, status);

    await logActivity({
      type: 'update',
      action: 'Pembaruan Status Pencetakan QR',
      description: `Memutakhirkan status fisik batch QR ID #${batchId} menjadi "${status}".`,
    });

    revalidatePath('/dashboard/qr-node');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating batch status:', error);
    return { success: false, error: error.message || 'Gagal memperbarui status batch.' };
  }
}
