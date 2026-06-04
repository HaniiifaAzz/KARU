import { customType } from 'drizzle-orm/pg-core';

// Tipe Point untuk koordinat GPS (contoh: lokasi foto daun)
export const geographyPoint = customType<{ data: [number, number], driverData: string }>({
  dataType() {
    return 'geography(Point, 4326)';
  },
  toDriver(val) {
    // Array [longitude, latitude] diubah ke standard WKT
    return `POINT(${val[0]} ${val[1]})`;
  },
});

// Tipe Polygon untuk batas wilayah Geofencing
// Frontend (Leaflet) mengirimkan Polygon geometry. Backend akan menyimpannya sebagai geography(Polygon).
export const geographyPolygon = customType<{ data: string /* WKT string */, driverData: string }>({
  dataType() {
    return 'geography(Polygon, 4326)';
  },
});
