import { NextResponse } from 'next/server';
import { QrNodeService } from '@/lib/services/qr-node.service';
import { QrNodeRepository } from '@/lib/repositories/qr-node.repository';

const qrNodeService = new QrNodeService();
const qrNodeRepo = new QrNodeRepository();

/**
 * GET /api/mobile/qr-nodes?nodeId=KARU-ARB-A-001
 * Mobile app memvalidasi QR code yang dipindai — kembalikan info node + workspace.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const nodeId = searchParams.get('nodeId');

    if (!nodeId) {
      return NextResponse.json(
        { success: false, error: 'Parameter "nodeId" wajib diisi.' },
        { status: 400 }
      );
    }

    const node = await qrNodeRepo.findNodeById(nodeId);

    if (!node) {
      return NextResponse.json(
        { success: false, error: 'Node QR tidak ditemukan dalam sistem.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: node.id,
          batchId: node.batchId,
          workspaceId: node.workspaceId,
          workspaceName: node.workspaceName,
          zone: node.zone,
          status: node.status,
          lastScannedAt: node.lastScannedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mobile/qr-nodes
 * Mobile app mengupdate status node ke "Online" saat dipindai.
 */
export async function POST(req: Request) {
  try {
    const { nodeId } = await req.json();

    if (!nodeId) {
      return NextResponse.json(
        { success: false, error: 'Field "nodeId" wajib dikirim.' },
        { status: 400 }
      );
    }

    const result = await qrNodeService.updateNodeStatusFromMobileScan(nodeId);

    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
