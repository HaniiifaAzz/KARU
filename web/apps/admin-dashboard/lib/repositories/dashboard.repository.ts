import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { workspaces, qrNodes, qrBatches, aiScanLogs, pestsDiseases, sops, geofences } from '../db/schema';

export class DashboardRepository {
  /**
   * Mengambil seluruh workspace beserta polygon geofence (GeoJSON) dan statistik per-zona
   * untuk ditampilkan di peta interaktif dashboard
   */
  async getWorkspacesWithGeofences() {
    // 1. Ambil semua workspace
    const allWs = await db.select().from(workspaces);

    // 2. Ambil semua geofence polygon sebagai GeoJSON
    const geoRows = await db
      .select({
        workspaceId: geofences.workspaceId,
        geojson: sql<string>`ST_AsGeoJSON(${geofences.polygonInfo}::geometry)`,
      })
      .from(geofences);

    // Map workspace_id → geojson string
    const geoMap: Record<string, string> = {};
    for (const row of geoRows) {
      if (row.workspaceId) geoMap[row.workspaceId] = row.geojson;
    }

    // 3. Hitung scan per workspace
    const scanCounts = await db
      .select({
        workspaceId: aiScanLogs.workspaceId,
        count: sql<number>`count(*)::int`,
      })
      .from(aiScanLogs)
      .groupBy(aiScanLogs.workspaceId);

    const scanMap: Record<string, number> = {};
    for (const row of scanCounts) {
      if (row.workspaceId) scanMap[row.workspaceId] = row.count;
    }

    // 4. Hitung node aktif (Online) per workspace melalui qr_batches
    const nodeCountRows = await db
      .select({
        workspaceId: qrBatches.workspaceId,
        count: sql<number>`count(*)::int`,
      })
      .from(qrNodes)
      .innerJoin(qrBatches, eq(qrNodes.batchId, qrBatches.id))
      .where(eq(qrNodes.status, 'Online'))
      .groupBy(qrBatches.workspaceId);

    const nodeMap: Record<string, number> = {};
    for (const row of nodeCountRows) {
      if (row.workspaceId) nodeMap[row.workspaceId] = row.count;
    }

    // 5. Gabungkan semua data
    return allWs.map(ws => ({
      id: ws.id,
      name: ws.name,
      category: ws.category,
      status: ws.status,
      priority: ws.priority,
      description: ws.description,
      areaInfo: ws.areaInfo,
      geojson: geoMap[ws.id] || null,  // GeoJSON string polygon, null jika belum ada
      scanCount: scanMap[ws.id] || 0,
      activeNodes: nodeMap[ws.id] || 0,
    }));
  }

  /**
   * Mengambil kompilasi seluruh metrik dasbor umum
   */
  async getSummaryMetrics() {
    // 1. Total Ruang Kerja & Perhitungan estimasi lahan
    const allWorkspaces = await db.select().from(workspaces);
    let totalArea = 0;
    for (const ws of allWorkspaces) {
      if (ws.areaInfo) {
        const m = ws.areaInfo.match(/[\d.]+/);
        if (m) totalArea += parseFloat(m[0]);
      }
    }

    // 2. Node QR Aktif (Status Online atau telah dipindai)
    const activeNodesRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(qrNodes)
      .where(eq(qrNodes.status, 'Online'));
    const activeNodesCount = activeNodesRes[0]?.count || 0;

    // 3. Total Pemindaian AI
    const scansRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(aiScanLogs);
    const totalScans = scansRes[0]?.count || 0;

    // 4. Total SOP aktif
    const sopsRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sops);
    const totalSops = sopsRes[0]?.count || 0;

    // 5. Distribusi Kategori Penyakit/Hama dari Log AI
    // Kita left join dengan pestsDiseases untuk mengetahui jenisnya (Penyakit / Hama)
    const scanDistribution = await db
      .select({
        jenis: pestsDiseases.jenis,
        diagnosisResult: aiScanLogs.diagnosisResult,
        count: sql<number>`count(*)::int`,
      })
      .from(aiScanLogs)
      .leftJoin(pestsDiseases, eq(aiScanLogs.diseaseId, pestsDiseases.id))
      .groupBy(pestsDiseases.jenis, aiScanLogs.diagnosisResult);

    let penyakitCount = 0;
    let hamaCount = 0;
    let sehatCount = 0;

    for (const item of scanDistribution) {
      const label = (item.diagnosisResult || '').toLowerCase();
      const jenis = (item.jenis || '').toLowerCase();
      if (label.includes('sehat') || label.includes('normal')) {
        sehatCount += item.count;
      } else if (jenis.includes('hama') || label.includes('hama')) {
        hamaCount += item.count;
      } else {
        // Default ke penyakit jika terdeteksi anomali
        penyakitCount += item.count;
      }
    }

    // 6. Tren Pindaian Harian (7 hari terakhir)
    // Untuk mempermudah kompatibilitas lintas SQL, kita ambil 100 log terakhir lalu kelompokkan di JS/TS
    const recentScansForTrend = await db
      .select({
        scannedAt: aiScanLogs.scannedAt,
      })
      .from(aiScanLogs)
      .orderBy(desc(aiScanLogs.scannedAt))
      .limit(200);

    // Format tren harian (Senin - Minggu atau 7 hari berurutan)
    const daysMap: Record<string, number> = {};
    // Inisialisasi 7 hari ke belakang
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('id-ID', { weekday: 'short' });
      daysMap[dateStr] = 0;
    }

    for (const scan of recentScansForTrend) {
      if (scan.scannedAt) {
        const dateStr = new Date(scan.scannedAt).toLocaleDateString('id-ID', { weekday: 'short' });
        if (daysMap[dateStr] !== undefined) {
          daysMap[dateStr]++;
        }
      }
    }

    const dailyTrend = Object.keys(daysMap).map(day => ({
      day,
      count: daysMap[day],
    }));

    return {
      totalWorkspaces: allWorkspaces.length,
      totalArea: totalArea,
      activeNodesCount: activeNodesCount,
      totalScans: totalScans,
      totalSops: totalSops,
      distribution: {
        penyakit: penyakitCount,
        hama: hamaCount,
        sehat: sehatCount,
      },
      dailyTrend,
    };
  }
}
