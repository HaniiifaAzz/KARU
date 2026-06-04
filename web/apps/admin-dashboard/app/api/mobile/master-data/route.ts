import { NextResponse } from 'next/server';
import { MasterDataService } from '@/lib/services/master-data.service';

const masterDataService = new MasterDataService();

export async function GET() {
  try {
    // 1. Otorisasi Mobile Request bisa ditambahkan di sini via BetterAuth API tokens / Headers
    
    // 2. Fetch All Master Data
    const data = await masterDataService.getMasterDataCollections();

    // 3. Berikan response JSON
    return NextResponse.json({
      success: true,
      message: 'Berhasil mensinkronisasi data master (Tanaman, Hama, SOP).',
      data
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
