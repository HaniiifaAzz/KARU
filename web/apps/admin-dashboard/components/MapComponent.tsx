"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Polygon, Popup, Tooltip, Marker } from "react-leaflet";
import L from "leaflet";

// Fix for default marker icons in Leaflet + Next.js
const DEFAULT_ICON = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DEFAULT_ICON;

// Define polygon coordinates for the mock zones
const zoneA_coords: [number, number][] = [
  [-3.46, -62.21],
  [-3.46, -62.19],
  [-3.48, -62.18],
  [-3.48, -62.20],
];

const zoneB_coords: [number, number][] = [
  [-3.43, -62.16],
  [-3.44, -62.14],
  [-3.46, -62.15],
  [-3.45, -62.17],
];

export default function MapComponent() {
  return (
    <MapContainer
      center={[-3.45, -62.18]}
      zoom={13}
      scrollWheelZoom={true}
      className="w-full h-full cursor-crosshair"
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-tiles"
      />
      
      {/* Zone A */}
      <Polygon pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.2, weight: 3 }} positions={zoneA_coords}>
        <Tooltip direction="center" permanent className="bg-transparent border-none text-emerald-900 font-bold shadow-none">
          Blok A
        </Tooltip>
        <Popup>
          <div className="font-sans">
            <h4 className="font-bold text-emerald-700">Blok A - Hasil Tinggi</h4>
            <p className="text-xs mt-1">Status: Aktif</p>
            <p className="text-xs">Luas: 1,240.5 Ha</p>
          </div>
        </Popup>
      </Polygon>

      {/* Zone B */}
      <Polygon pathOptions={{ color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 0.2, weight: 3 }} positions={zoneB_coords}>
        <Tooltip direction="center" permanent className="bg-transparent border-none text-amber-900 font-bold shadow-none textShadow">
          Sektor B
        </Tooltip>
        <Popup>
          <div className="font-sans">
            <h4 className="font-bold text-amber-600">Sektor B - Pemulihan</h4>
            <p className="text-xs mt-1">Status: Pemantauan</p>
            <p className="text-xs">Luas: 840.2 Ha</p>
          </div>
        </Popup>
      </Polygon>
      
      {/* A reference marker */}
      <Marker position={[-3.445, -62.165]}>
        <Popup>Titik Referensi Ekologi</Popup>
      </Marker>

    </MapContainer>
  );
}
