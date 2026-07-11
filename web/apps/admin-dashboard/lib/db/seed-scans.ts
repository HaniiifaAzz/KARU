import { db } from './index';
import { aiScanLogs, user, workspaces, pestsDiseases } from './schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function main() {
  console.log("Memulai proses seeding data dummy AI Scan...");

  try {
    // 1. Ambil data user, workspace, dan pests/diseases yang sudah ada
    const dbUsers = await db.select().from(user);
    const dbWorkspaces = await db.select().from(workspaces);
    const dbPestsDiseases = await db.select().from(pestsDiseases);

    if (dbUsers.length === 0 || dbWorkspaces.length === 0) {
      console.error("Gagal: Database harus memiliki minimal 1 User dan 1 Workspace sebelum seeding AI Scan.");
      process.exit(1);
    }

    const adminUser = dbUsers.find(u => u.role === 'admin') || dbUsers[0];
    const operatorUser = dbUsers.find(u => u.role === 'operator') || dbUsers[0];
    const mainWorkspace = dbWorkspaces.find(w => w.id === 'WS-001') || dbWorkspaces[0];
    const secondaryWorkspace = dbWorkspaces.find(w => w.id !== mainWorkspace.id) || dbWorkspaces[0];

    const ganoderma = dbPestsDiseases.find(p => p.id === 'PST-001');
    const ulatKantong = dbPestsDiseases.find(p => p.id === 'PST-002');

    console.log(`Menggunakan User: ${operatorUser.name} (${operatorUser.role}) & ${adminUser.name} (${adminUser.role})`);
    console.log(`Menggunakan Workspace Utama: ${mainWorkspace.name} (${mainWorkspace.id})`);

    // Hapus log scan lama agar bersih (opsional, tapi bagus untuk pengetesan awal)
    console.log("Membersihkan log AI scan lama...");
    await db.delete(aiScanLogs);

    // 2. Tentukan Dummy Scans
    const dummyScans = [
      {
        userId: operatorUser.id,
        workspaceId: mainWorkspace.id,
        location: [114.5928, -3.3149] as [number, number], // Longitude, Latitude
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpdCGRTt_czVoK4QB5oJaUltyWXvisjHA4_y0XmPNFRjI3IPZ81ibjes7OkWdJn04oFviWQm3yPOZg948lqnLRuDbLYKmG8gbs0AZoEi4qDhaBdDY19_jOcz4m_iLs4vWegSyp6XcPmEa0_7tZwRwgNZtTIfrOTsLbMCxaLSw_mjBViuevCNY_CaNdVyvxCDUkVHAT479D4inrC7dN5Pt_5-YxJzJUvD1_yvVSRtUJV12g1WVyibVdPR4QVKp1hyrkpmISGl8vn596',
        validationStatus: 'Valid',
        diagnosisResult: 'Gejala Infeksi Jamur Ganoderma',
        diseaseId: ganoderma?.id || null,
        probability: 92,
        scannedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 jam yang lalu
      },
      {
        userId: operatorUser.id,
        workspaceId: mainWorkspace.id,
        location: [114.5912, -3.3155] as [number, number],
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbcqYJpRlpbpmNvtjWtkInq1oFHwVTlHDo76-3SjOumxLu-QWGdEUHOvNyrO9Ixxyxsqls0bzTJMyI62LFC832YZGiuDmHDgx5wIeWnJwteeImd8KZzY_MmpRO8e0j3PQGNENO02cO7yPB7rmpsyqLF7GYS3oFKGop0xbrEIHlbPe3puvznVEENz4pdl8IZCHGYsAr596ylVRgdeWh9GKAQSnBQZKQitH_qWGylScGuG19pyObORSq9JALBvFa83RyulXDnCc-VY3y',
        validationStatus: 'Valid',
        diagnosisResult: 'Daun terserang Ulat Kantong',
        diseaseId: ulatKantong?.id || null,
        probability: 85,
        scannedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 jam yang lalu
      },
      {
        userId: operatorUser.id,
        workspaceId: mainWorkspace.id,
        location: [114.5905, -3.3138] as [number, number],
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyWbx9BO08ncVVRbqVpJzuLj1wJhdwUSfAW628zWFM8Vw2T1SpQK6yCqDXVFA8v0LbG6TpFL4H_73G_H4aemb59ixnal4OekGH4UfxkBoXAvAp-3yixMAgVuDOoPVJIK2keOB03ge3DBzMuVJ7KqtaiGUDOGy_dsOvfZviKDSFrygLXsI8m5NmTW7eAaMzSLNNTln8ZCLLJvnx6foiDnjFT29tNl9K-H3ZVtFwnQgrdeL4uXAVPMEbiMeRyVUi1lhUwuDhd6iBddW8',
        validationStatus: 'Valid',
        diagnosisResult: 'Sehat / Tidak Ada Gejala Hama',
        diseaseId: null,
        probability: 98,
        scannedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 hari yang lalu
      },
      {
        userId: adminUser.id,
        workspaceId: secondaryWorkspace.id,
        location: [114.6215, -3.2842] as [number, number], // Koordinat di luar batas workspace target
        imageUrl: null, // Tanpa gambar (menggunakan fallback image di UI)
        validationStatus: 'Di Luar Batas',
        diagnosisResult: 'Dugaan Serangan Ulat Kantong (Lokasi Janggal)',
        diseaseId: ulatKantong?.id || null,
        probability: 74,
        scannedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 hari yang lalu
      },
      {
        userId: operatorUser.id,
        workspaceId: mainWorkspace.id,
        location: [114.5933, -3.3142] as [number, number],
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpdCGRTt_czVoK4QB5oJaUltyWXvisjHA4_y0XmPNFRjI3IPZ81ibjes7OkWdJn04oFviWQm3yPOZg948lqnLRuDbLYKmG8gbs0AZoEi4qDhaBdDY19_jOcz4m_iLs4vWegSyp6XcPmEa0_7tZwRwgNZtTIfrOTsLbMCxaLSw_mjBViuevCNY_CaNdVyvxCDUkVHAT479D4inrC7dN5Pt_5-YxJzJUvD1_yvVSRtUJV12g1WVyibVdPR4QVKp1hyrkpmISGl8vn596',
        validationStatus: 'Valid',
        diagnosisResult: 'Ganoderma stadium awal',
        diseaseId: ganoderma?.id || null,
        probability: 89,
        scannedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 hari yang lalu
      }
    ];

    console.log(`Memulai insersi ${dummyScans.length} records ke tabel aiScanLogs...`);
    for (const scan of dummyScans) {
      await db.insert(aiScanLogs).values({
        userId: scan.userId,
        workspaceId: scan.workspaceId,
        location: scan.location,
        imageUrl: scan.imageUrl,
        validationStatus: scan.validationStatus,
        diagnosisResult: scan.diagnosisResult,
        diseaseId: scan.diseaseId as any,
        probability: scan.probability,
        scannedAt: scan.scannedAt,
      });
    }

    console.log("Seeding AI Scan berhasil!");
  } catch (err) {
    console.error("Gagal melakukan seeding AI Scan:", err);
  } finally {
    // @ts-ignore
    process.exit(0);
  }
}

main();
