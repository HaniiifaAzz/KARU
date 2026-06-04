import { NextResponse } from 'next/server';
import { AiScanService } from '@/lib/services/ai-scan.service';

const aiScanService = new AiScanService();

export async function POST(req: Request) {
  try {
    // 1. Auth Guard (Mobile Session or API Keys)
    // - Jika pakai BetterAuth, cek token Bearer dari Header

    const body = await req.json();
    
    // Asumsikan payload dari HP berisi:
    // {
    //   workspaceId: "ws-001",
    //   qrNodeId: "KARU-ARB-A-001" (Opsional),
    //   lng: -62.1950,
    //   lat: -3.4720,
    //   diagnosisResult: "Koloni Kutu Daun",
    //   probability: 92,
    //   diseaseId: "PH-001",
    //   imageUrl: "https://..."
    // }

    // Hardcode operator_id sementara
    const userId = "op_id_123";

    // 2. Eksekusi Core Business Logic AI Scan (Termasuk Validasi Geofence Point-in-Polygon)
    const result = await aiScanService.processIncomingScan(userId, body);

    // 3. Return HTTP Response ke Aplikasi Mobile
    // Akan mengembalikan { success, logId, validationStatus, message }
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
