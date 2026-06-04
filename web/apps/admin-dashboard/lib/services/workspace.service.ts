import { WorkspaceRepository } from '../repositories/workspace.repository';

export class WorkspaceService {
  private repo: WorkspaceRepository;

  constructor() {
    this.repo = new WorkspaceRepository();
  }

  async getAllWorkspaces() {
    return await this.repo.findAllWorkspaces();
  }

  async getWorkspaceDetails(id: string) {
    return await this.repo.findWorkspaceById(id);
  }

  /**
   * Konversi GeoJSON sederhana (Feature Polygon) ke Well-Known Text (WKT)
   * supaya bisa disimpan via function ST_GeogFromText PostGIS
   */
  private convertGeojsonPolygonToWKT(geojsonObj: any): string {
    // Contoh sederhana: Mengambil coordinates array pertama dari GeoJSON bertipe "Polygon"
    if (!geojsonObj || geojsonObj.type !== 'Polygon') {
      throw new Error('Invalid GeoJSON Polygon format');
    }

    const rings = geojsonObj.coordinates.map((ring: number[][]) => {
      // Pastikan polygon ring tertutup (titik awal = titik akhir)
      if (ring.length > 0) {
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          ring.push([...first]);
        }
      }
      return '(' + ring.map(coord => `${coord[0]} ${coord[1]}`).join(', ') + ')';
    });

    return `POLYGON(${rings.join(', ')})`;
  }

  /**
   * Fungsi untuk menerima boundary dari frontend (Leaflet .toGeoJSON) dan menyimpan ke backend
   */
  async setupWorkspaceGeofence(workspaceId: string, geojsonPolygon: any) {
    // 1. Validasi Workspace terlampir
    const ws = await this.getWorkspaceDetails(workspaceId);
    if (!ws) throw new Error('Workspace tidak ditemukan.');

    // 2. Parsial geojson ke WKT
    const wkt = this.convertGeojsonPolygonToWKT(geojsonPolygon);

    // 3. Simpan ke database
    await this.repo.saveGeofence(workspaceId, wkt);

    return { success: true, message: 'Geofence berhasil diperbarui.' };
  }
}
