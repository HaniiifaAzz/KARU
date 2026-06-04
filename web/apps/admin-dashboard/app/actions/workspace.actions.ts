"use server";

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { WorkspaceRepository } from '@/lib/repositories/workspace.repository';
import { WorkspaceService } from '@/lib/services/workspace.service';
import { logActivity } from '@/lib/activity-logger';


// ─── GET ALL ─────────────────────────────────────────────────────────────────
export async function getWorkspacesAction() {
  try {
    const repo = new WorkspaceRepository();
    const workspaces = await repo.findAllWorkspaces();
    return { success: true, data: workspaces };
  } catch (error: any) {
    console.error('Error fetching workspaces:', error);
    return { success: false, error: error.message, data: [] };
  }
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export async function createWorkspaceAction(
  data: {
    name: string;
    description?: string;
    category?: string;
    status?: string;
    priority?: string;
    areaInfo?: string;
    image?: string;
    assignedUserId?: string;
  },
  geojsonPolygon: any
) {
  try {
    const repo = new WorkspaceRepository();
    const service = new WorkspaceService();

    // Generate unique ID (max 20 chars)
    const id = `ws-${Date.now().toString().slice(-8)}`;

    // 1. Create Workspace Metadata
    await repo.createWorkspace({
      id,
      name: data.name,
      description: data.description,
      category: data.category,
      status: data.status,
      priority: data.priority,
      areaInfo: data.areaInfo,
      image: data.image,
      assignedUserId: data.assignedUserId,
    });

    // 2. Process and save Geofence WKT to PostGIS (jika ada polygon digambar)
    if (geojsonPolygon) {
      await service.setupWorkspaceGeofence(id, geojsonPolygon);
    }

    // Catat log aktivitas
    await logActivity({
      type: 'create',
      action: 'Pembuatan Ruang Kerja',
      description: `Menambahkan ruang kerja baru "${data.name}" (${data.category || 'Makro'}) ke dalam sistem.`,
    });

    revalidatePath('/dashboard/workspace');
    return { success: true, id };
  } catch (error: any) {
    console.error('Error creating workspace:', error);
    return { success: false, error: error.message || 'Gagal menyimpan workspace' };
  }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export async function updateWorkspaceAction(
  id: string,
  data: {
    name?: string;
    description?: string;
    status?: string;
    priority?: string;
    image?: string;
    assignedUserId?: string;
  }
) {
  try {
    const repo = new WorkspaceRepository();
    await repo.updateWorkspace(id, data);

    // Catat log aktivitas
    await logActivity({
      type: 'update',
      action: 'Pembaruan Ruang Kerja',
      description: `Memodifikasi atribut atau status pada ruang kerja ID #${id}.`,
    });

    revalidatePath('/dashboard/workspace');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating workspace:', error);
    return { success: false, error: error.message || 'Gagal memperbarui workspace' };
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function deleteWorkspaceAction(id: string) {
  try {
    const repo = new WorkspaceRepository();
    await repo.deleteWorkspace(id);

    // Catat log aktivitas
    await logActivity({
      type: 'delete',
      action: 'Penghapusan Ruang Kerja',
      description: `Menghapus ruang kerja ID #${id} beserta konfigurasi batas geofencing terkait.`,
    });

    revalidatePath('/dashboard/workspace');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting workspace:', error);
    return { success: false, error: error.message || 'Gagal menghapus workspace' };
  }
}
