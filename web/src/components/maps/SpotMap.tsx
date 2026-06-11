'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const SHADOW_URL =
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';

// ── Types ──
export interface TouristSpot {
  lat: number;
  lng: number;
  name: string;
}

export interface SpotMapProps {
  spots: TouristSpot[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

// Tourist spot icon (gold/yellow)
const spotIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: SHADOW_URL,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ── Constants ──
const SANTOS_CENTER: [number, number] = [-23.9608, -46.3336];
const DEFAULT_ZOOM = 13;

export default function SpotMap({
  spots,
  center = SANTOS_CENTER,
  zoom = DEFAULT_ZOOM,
  height = '320px',
}: SpotMapProps) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-border shadow-sm"
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {spots.map((spot, idx) => (
          <Marker key={idx} position={[spot.lat, spot.lng]} icon={spotIcon}>
            <Popup>
              <span className="text-sm font-semibold text-[#0A2463]">
                📍 {spot.name}
              </span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
