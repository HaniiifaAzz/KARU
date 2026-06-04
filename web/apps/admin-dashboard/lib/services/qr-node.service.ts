import { QrNodeRepository } from '../repositories/qr-node.repository';

// Fungsi bantuan generator unik id
const generateBatchId = () => `B-${Math.floor(Math.random() * 89999 + 10000)}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;

export class QrNodeService {
  private repo: QrNodeRepository;

  constructor() {
    this.repo = new QrNodeRepository();
  }

  /**
   * Logika pembuatan QR Batch untuk workspace target
   */
  async generateNewBatch(data: {
    workspaceId: string;
    zone: string;
    nodeCount: number;
    prefix: string;
    createdBy: string;
  }) {
    const batchId = generateBatchId();
    
    // 1. Insert tabel Batch
    await this.repo.createBatch({
      id: batchId,
      workspaceId: data.workspaceId,
      zone: data.zone,
      nodeCount: data.nodeCount,
      prefix: data.prefix,
      createdBy: data.createdBy,
    });

    // 2. Hasilkan array of Node IDs
    const nodeIds: string[] = [];
    for (let i = 1; i <= data.nodeCount; i++) {
        // e.g. "KARU-ARB-A-001"
       nodeIds.push(`${data.prefix}-${String(i).padStart(3, '0')}`);
    }

    // 3. Batch Insert isi nodes
    await this.repo.createNodesForBatch(batchId, nodeIds);

    return { success: true, batchId, nodeCount: data.nodeCount };
  }

  /**
   * API untuk mobile (Misal Operator set ulang flag node jadi ONLINE saat dipindai via HP)
   */
  async updateNodeStatusFromMobileScan(nodeId: string) {
    await this.repo.recordNodeScan(nodeId);
    return { message: "Status Node berhasil diperbarui ke Online." };
  }
}
