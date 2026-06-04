import { NextResponse } from 'next/server';
import { WorkspaceService } from '@/lib/services/workspace.service';

const workspaceService = new WorkspaceService();

export async function GET() {
  try {
    // Digunakan oleh Front-end (Web Dashboard Admin)
    const data = await workspaceService.getAllWorkspaces();
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Web Dashboard ngirim batas GeoJSON ke backend untuk disimpan
    // body berisi: { id: "ws-001", geojsonPolygon: { type: "Polygon", coordinates: [...] } }
    const { id, geojsonPolygon } = await req.json();

    const result = await workspaceService.setupWorkspaceGeofence(id, geojsonPolygon);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
