import { NextResponse } from 'next/server';
import { WorkspaceService } from '@/lib/services/workspace.service';

const workspaceService = new WorkspaceService();

/**
 * GET /api/mobile/workspaces
 * Mengembalikan daftar workspace yang berstatus Aktif untuk mobile app.
 */
export async function GET() {
  try {
    const allWorkspaces = await workspaceService.getAllWorkspaces();

    // Filter hanya workspace aktif
    const activeWorkspaces = allWorkspaces
      .filter(ws => ws.status?.toLowerCase() === 'aktif')
      .map(ws => ({
        id: ws.id,
        name: ws.name,
        category: ws.category,
        status: ws.status,
        priority: ws.priority,
        areaInfo: ws.areaInfo,
        image: ws.image,
      }));

    return NextResponse.json(
      { success: true, data: activeWorkspaces },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching workspaces for mobile:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
