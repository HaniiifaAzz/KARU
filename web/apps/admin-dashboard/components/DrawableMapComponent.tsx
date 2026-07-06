"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  useMap,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";

// Fix Leaflet default marker icons in Next.js
const DEFAULT_ICON = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DEFAULT_ICON;

// Koordinat fallback: Subang, Jawa Barat
const SUBANG_CENTER: [number, number] = [-6.5641, 107.7620];

// ── Helper: komponen dalam peta yang memindahkan view setelah geolocation ──
function RecenterMap({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 15, { animate: true });
    }
  }, [position, map]);
  return null;
}

// Calculate geodesic area in hectares from latlngs
function calcAreaHa(latlngs: L.LatLng[]): number {
  const R = 6378137;
  let area = 0;
  const n = latlngs.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = (latlngs[i].lng * Math.PI) / 180;
    const yi = (latlngs[i].lat * Math.PI) / 180;
    const xj = (latlngs[j].lng * Math.PI) / 180;
    const yj = (latlngs[j].lat * Math.PI) / 180;
    area += (xj - xi) * (2 + Math.sin(yi) + Math.sin(yj));
  }
  area = Math.abs((area * R * R) / 2);
  return area / 10000; // m² → Ha
}

// Format centroid
function calcCentroid(latlngs: L.LatLng[]): string {
  const lat = latlngs.reduce((s, p) => s + p.lat, 0) / latlngs.length;
  const lng = latlngs.reduce((s, p) => s + p.lng, 0) / latlngs.length;
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

interface Props {
  category: "makro" | "mikro";
  onAreaDrawn: (areaHa: number, coordsStr: string, geojson?: any) => void;
}

export default function DrawableMapComponent({ category, onAreaDrawn }: Props) {
  const polygonColor = category === "makro" ? "#10b981" : "#8b5cf6";

  // State untuk menyimpan posisi GPS pengguna
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [geoStatus, setGeoStatus] = useState<"loading" | "success" | "denied" | "unavailable">("loading");

  // Minta geolocation saat komponen pertama kali dimuat
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        setGeoStatus("success");
      },
      () => {
        // Ditolak atau timeout → pakai fallback Subang
        setGeoStatus("denied");
      },
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true }
    );
  }, []);

  const handleCreated = useCallback(
    (e: any) => {
      const layer = e.layer as L.Polygon;
      const latlngs = layer.getLatLngs()[0] as L.LatLng[];
      const areaHa = calcAreaHa(latlngs);
      const centroid = calcCentroid(latlngs);
      const geojson = layer.toGeoJSON();
      onAreaDrawn(areaHa, centroid, geojson.geometry);

      layer.setStyle({
        color: polygonColor,
        fillColor: polygonColor,
        fillOpacity: 0.2,
        weight: 3,
      });
    },
    [onAreaDrawn, polygonColor]
  );

  const handleDeleted = useCallback(() => {
    onAreaDrawn(0, "", null);
  }, [onAreaDrawn]);

  return (
    <div className="relative h-full w-full">
      {/* Status bar geolocation */}
      <div className="absolute top-14 right-3 z-[1000]">
        {geoStatus === "loading" && (
          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow border border-white/60 flex items-center gap-2 text-[10px] font-bold text-slate-500">
            <span className="material-symbols-outlined text-[14px] animate-spin text-emerald-500">refresh</span>
            Mencari lokasi Anda...
          </div>
        )}
        {geoStatus === "success" && (
          <div className="bg-emerald-50/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow border border-emerald-200 flex items-center gap-2 text-[10px] font-bold text-emerald-700">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
            Peta di lokasi Anda
          </div>
        )}
        {(geoStatus === "denied" || geoStatus === "unavailable") && (
          <div className="bg-amber-50/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow border border-amber-200 flex items-center gap-2 text-[10px] font-bold text-amber-700">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_off</span>
            Default: Subang, Jawa Barat
          </div>
        )}
      </div>

      <MapContainer
        center={SUBANG_CENTER}
        zoom={13}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        className="h-full w-full"
      >
        {/* Pindahkan view ke lokasi nyata pengguna setelah geolocation selesai */}
        <RecenterMap position={userPosition} />

        {/* === Tile Layer: Google Maps Satellite ===
             Satelit dengan resolusi sangat tinggi dan zoom level dalam */}
        <TileLayer
          url="http://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          attribution="&copy; Google Maps"
          maxZoom={22}
          maxNativeZoom={20}
        />

        {/* Label overlay: nama jalan, kota, tempat dari OpenStreetMap */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          opacity={0.45}
          maxZoom={22}
          maxNativeZoom={19}
        />

        {/* Drawing tools */}
        <FeatureGroup>
          <EditControl
            position="topleft"
            onCreated={handleCreated}
            onDeleted={handleDeleted}
            draw={{
              polygon: {
                allowIntersection: false,
                showArea: true,
                shapeOptions: {
                  color: polygonColor,
                  fillColor: polygonColor,
                  fillOpacity: 0.2,
                  weight: 3,
                },
              },
              rectangle: false,
              circle: false,
              circlemarker: false,
              marker: false,
              polyline: false,
            }}
            edit={{
              remove: true,
            }}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
}
