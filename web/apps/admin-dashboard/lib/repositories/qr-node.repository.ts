import { eq, sql, desc } from 'drizzle-orm';
import { db } from '../db';
import { qrBatches, qrNodes, workspaces, user } from '../db/schema';

export class QrNodeRepository {
  async getBatchByWorkspace(workspaceId: string) {
    return await db.select().from(qrBatches).where(eq(qrBatches.workspaceId, workspaceId));
  }

  /**
   * Ambil semua batch dengan JOIN ke workspace dan user (untuk dashboard)
   */
  async getAllBatches() {
    return await db
      .select({
        id: qrBatches.id,
        workspaceId: qrBatches.workspaceId,
        workspaceName: workspaces.name,
        zone: qrBatches.zone,
        nodeCount: qrBatches.nodeCount,
        prefix: qrBatches.prefix,
        status: qrBatches.status,
        createdBy: qrBatches.createdBy,
        createdByName: user.name,
        createdAt: qrBatches.createdAt,
      })
      .from(qrBatches)
      .leftJoin(workspaces, eq(qrBatches.workspaceId, workspaces.id))
      .leftJoin(user, eq(qrBatches.createdBy, user.id))
      .orderBy(desc(qrBatches.createdAt));
  }

  /**
   * Cari node berdasarkan ID dengan info batch dan workspace (untuk mobile)
   */
  async findNodeById(nodeId: string) {
    const result = await db
      .select({
        id: qrNodes.id,
        batchId: qrNodes.batchId,
        status: qrNodes.status,
        lastScannedAt: qrNodes.lastScannedAt,
        workspaceId: qrBatches.workspaceId,
        workspaceName: workspaces.name,
        zone: qrBatches.zone,
      })
      .from(qrNodes)
      .leftJoin(qrBatches, eq(qrNodes.batchId, qrBatches.id))
      .leftJoin(workspaces, eq(qrBatches.workspaceId, workspaces.id))
      .where(eq(qrNodes.id, nodeId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Ambil semua nodes milik sebuah batch
   */
  async getNodesByBatch(batchId: string) {
    return await db
      .select()
      .from(qrNodes)
      .where(eq(qrNodes.batchId, batchId));
  }

  async createBatch(data: {
    id: string;
    workspaceId: string;
    zone?: string;
    nodeCount: number;
    prefix?: string;
    createdBy: string;
  }) {
    return await db.insert(qrBatches).values(data).returning();
  }

  /**
   * Method untuk generate multiple nodes untuk sebuah batch
   */
  async createNodesForBatch(batchId: string, nodeIds: string[]) {
    // Membentuk array values [{ id: 'KARU-XXX', batchId: '...', status: 'Offline' }]
    const values = nodeIds.map(nodeId => ({
      id: nodeId,
      batchId: batchId,
      status: 'Offline'
    }));

    return await db.insert(qrNodes).values(values);
  }

  /**
   * Update status node jadi Online / LastScanned
   */
  async recordNodeScan(nodeId: string) {
    return await db.update(qrNodes)
      .set({ status: 'Online', lastScannedAt: new Date() })
      .where(eq(qrNodes.id, nodeId));
  }

  /**
   * Hapus batch (nodes terhapus otomatis via cascade)
   */
  async deleteBatch(batchId: string) {
    return await db.delete(qrBatches).where(eq(qrBatches.id, batchId));
  }

  /**
   * Update status batch (misal: 'Dicetak')
   */
  async updateBatchStatus(batchId: string, status: string) {
    return await db
      .update(qrBatches)
      .set({ status })
      .where(eq(qrBatches.id, batchId));
  }
}
