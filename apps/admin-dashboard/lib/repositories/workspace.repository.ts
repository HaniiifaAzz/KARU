import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { geofences, workspaces } from '../db/schema';

export class WorkspaceRepository {
  /**
   * Menemukan semua data Workspace
   */
  async findAllWorkspaces() {
    return await db.select().from(workspaces);
  }

  /**
   * Menemukan ruang kerja berdasar ID
   */
  async findWorkspaceById(id: string) {
    const result = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return result.length ? result[0] : null;
  }

  /**
   * Membuat Workspace Baru
   */
  async createWorkspace(data: { id: string, name: string, category?: string, status?: string, priority?: string, description?: string, areaInfo?: string, image?: string }) {
    await db.insert(workspaces).values(data);
    return data.id;
  }

  /**
   * Membuat atau Update geofence Polygon dari WKT 
   */
  async saveGeofence(workspaceId: string, wktString: string) {
    // Menggunakan ST_GeomFromText dengan SRID 4326 agar sesuai dengan tipe geometry di Drizzle
    return await db.insert(geofences).values({
      workspaceId,
      polygonInfo: sql`ST_GeomFromText(${wktString}, 4326)` as any
    });
  }

  /**
   * Memperbarui data Workspace berdasarkan ID
   */
  async updateWorkspace(id: string, data: { name?: string, description?: string, status?: string, priority?: string, image?: string }) {
    await db.update(workspaces).set(data).where(eq(workspaces.id, id));
  }

  /**
   * Menghapus Workspace beserta geofence-nya (cascade dari foreign key)
   */
  async deleteWorkspace(id: string) {
    // Geofence terhapus otomatis karena ada onDelete: 'cascade' di schema
    await db.delete(workspaces).where(eq(workspaces.id, id));
  }


  /**
   * Pengecekan Point In Polygon menggunakan fungsi PostGIS: ST_Contains atau ST_Covers
   * lng = longitude (X), lat = latitude (Y)
   */
  async isPointInsideWorkspace(workspaceId: string, lng: number, lat: number): Promise<boolean> {
    const res = await db.select()
      .from(geofences)
      .where(sql`
        ${geofences.workspaceId} = ${workspaceId} 
        AND ST_Covers(
          ${geofences.polygonInfo}::geometry, 
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        )
      `)
      .limit(1);

    return res.length > 0;
  }
}
