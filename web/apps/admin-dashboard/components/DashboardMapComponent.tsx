"use client";

import { useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Polygon, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";

// ── Types ────────────────────────────────────────────────────────────────────
export type MapWorkspace = {
  id: string;
  name: string;
  category: string | null;
  status: string | null;
  priority: string | null;
  description: string | null;
  areaInfo: string | null;
  geojson: string | null; // GeoJSON Polygon string
  scanCount: number;
  activeNodes: number;
};

// ── Color mapping berdasarkan status ─────────────────────────────────────────
const STATUS_COLORS: Record<string, { stroke: string; fill: string; label: string }> = {
  aktif:        { stroke: '#10b981', fill: '#10b981', label: 'Aktif' },
  perencanaan:  { stroke: '#0ea5e9', fill: '#0ea5e9', label: 'Perencanaan' },
  ditangguhkan: { stroke: '#f59e0b', fill: '#f59e0b', label: 'Ditangguhkan' },
};

function getStatusColor(status: string | null) {
  const key = (status || '').toLowerCase();
  return STATUS_COLORS[key] || { stroke: '#64748b', fill: '#64748b', label: status || 'Lainnya' };
}

// ── Priority badge color ─────────────────────────────────────────────────────
function getPriorityStyle(priority: string | null) {
  const p = (priority || '').toLowerCase();
  if (p === 'kritis')  return 'bg-rose-100 text-rose-700';
  if (p === 'tinggi')  return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

// ── Auto-fit bounds ──────────────────────────────────────────────────────────
function FitBounds({ positions }: { positions: [number, number][][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    const allPoints = positions.flat();
    if (allPoints.length === 0) return;
    const bounds = L.latLngBounds(allPoints.map(p => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [positions, map]);
  return null;
}

// ── Konversi GeoJSON polygon string ke Leaflet LatLng array ──────────────────
function geojsonToLatLngs(geojsonStr: string): [number, number][] | null {
  try {
    const geojson = JSON.parse(geojsonStr);
    if (geojson.type !== 'Polygon' || !geojson.coordinates?.[0]) return null;
    // GeoJSON = [lng, lat], Leaflet = [lat, lng]
    return geojson.coordinates[0].map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
  } catch {
    return null;
  }
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function DashboardMapComponent({ workspaces }: { workspaces: MapWorkspace[] }) {
  // Parse polygon dari setiap workspace yang punya geojson
  const polygonData = useMemo(() => {
    return workspaces
      .map(ws => {
        const coords = ws.geojson ? geojsonToLatLngs(ws.geojson) : null;
        return { ...ws, coords };
      })
      .filter(ws => ws.coords !== null) as (MapWorkspace & { coords: [number, number][] })[];
  }, [workspaces]);

  const allPositions = useMemo(() => polygonData.map(p => p.coords), [polygonData]);

  // Hitung jumlah workspace per status untuk legenda
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    workspaces.forEach(ws => {
      const key = (ws.status || 'Lainnya').toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [workspaces]);

  // Default center: Subang, Jawa Barat
  const defaultCenter: [number, number] = [-6.5641, 107.7620];

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        {/* Auto-fit ke semua polygon */}
        <FitBounds positions={allPositions} />

        {/* Google Maps Satellite tiles */}
        <TileLayer
          url="http://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          attribution="&copy; Google Maps"
          maxZoom={22}
          maxNativeZoom={20}
        />
        {/* OSM Label overlay */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          opacity={0.45}
          maxZoom={22}
          maxNativeZoom={19}
        />

        {/* Render semua polygon workspace */}
        {polygonData.map((ws) => {
          const color = getStatusColor(ws.status);
          return (
            <Polygon
              key={ws.id}
              positions={ws.coords}
              pathOptions={{
                color: color.stroke,
                fillColor: color.fill,
                fillOpacity: 0.25,
                weight: 3,
              }}
            >
              {/* Nama workspace di tengah polygon */}
              <Tooltip
                direction="center"
                permanent
                className="dashboard-map-tooltip"
              >
                <span style={{ fontWeight: 700, fontSize: '11px', textShadow: '0 1px 4px rgba(0,0,0,0.5)', color: '#fff' }}>
                  {ws.name}
                </span>
              </Tooltip>

              {/* Popup detail saat klik */}
              <Popup maxWidth={320} className="dashboard-map-popup">
                <div style={{ fontFamily: "'Inter', 'Manrope', sans-serif", minWidth: 240 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: color.fill, flexShrink: 0, boxShadow: `0 0 6px ${color.fill}80`
                    }} />
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                      {ws.name}
                    </h4>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: color.fill + '1a', color: color.fill, textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      {color.label}
                    </span>
                    {ws.category && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        background: ws.category === 'makro' ? '#10b98118' : '#8b5cf618',
                        color: ws.category === 'makro' ? '#047857' : '#6d28d9',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {ws.category === 'makro' ? 'Lahan Makro' : ws.category === 'mikro' ? 'Lahan Mikro' : ws.category}
                      </span>
                    )}
                    {ws.priority && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        background: ws.priority.toLowerCase() === 'kritis' ? '#fecdd3' : ws.priority.toLowerCase() === 'tinggi' ? '#fef3c7' : '#f1f5f9',
                        color: ws.priority.toLowerCase() === 'kritis' ? '#be123c' : ws.priority.toLowerCase() === 'tinggi' ? '#b45309' : '#475569',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {ws.priority}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {ws.description && (
                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 10px', lineHeight: 1.5 }}>
                      {ws.description.length > 100 ? ws.description.slice(0, 100) + '...' : ws.description}
                    </p>
                  )}

                  {/* Stats Grid */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6,
                    background: '#f8fafc', borderRadius: 10, padding: 10,
                    border: '1px solid #e2e8f0',
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0ea5e9' }}>
                        {ws.scanCount}
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Pindaian
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>
                        {ws.activeNodes}
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Node Aktif
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#8b5cf6' }}>
                        {ws.areaInfo || '—'}
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Luas
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        })}
      </MapContainer>

      {/* ── Legenda Overlay ──────────────────────────────────────────────────── */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 p-4 max-w-[240px]">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
          <span className="material-symbols-outlined text-[14px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>
            legend_toggle
          </span>
          <h5 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
            Legenda Status Zona
          </h5>
        </div>
        <div className="space-y-2">
          {Object.entries(STATUS_COLORS).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2.5">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                style={{ background: val.fill, boxShadow: `0 0 6px ${val.fill}40` }}
              />
              <span className="text-[11px] font-bold text-slate-700 flex-1">{val.label}</span>
              <span className="text-[10px] font-extrabold text-slate-400">
                {statusCounts[key] || 0}
              </span>
            </div>
          ))}
        </div>

        {/* Total workspace tanpa polygon */}
        {workspaces.filter(ws => !ws.geojson).length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[12px] text-slate-400">info</span>
              <span className="text-[10px] text-slate-400 font-medium">
                {workspaces.filter(ws => !ws.geojson).length} zona tanpa batas peta
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Badge Live Map ───────────────────────────────────────────────────── */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-white/60 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">
          Live Map
        </span>
      </div>
    </div>
  );
}
