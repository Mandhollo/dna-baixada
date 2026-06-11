'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const SHADOW_URL =
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';

// Green icon for origin
const originIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: SHADOW_URL,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Red icon for destination
const destinationIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: SHADOW_URL,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ── Types ──
export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteMapProps {
  origin?: LatLng | null;
  destination?: LatLng | null;
  onOriginChange: (lat: number, lng: number, address: string) => void;
  onDestChange: (lat: number, lng: number, address: string) => void;
}

// ── Constants ──
const SANTOS_CENTER: [number, number] = [-23.9608, -46.3336];
const DEFAULT_ZOOM = 13;

// ── Nominatim geocoder (free, no key) ──
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`,
      { headers: { 'User-Agent': 'DNA-Baixada-App/1.0' } }
    );
    const data = await res.json();
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

async function forwardGeocode(
  query: string
): Promise<Array<{ lat: number; lng: number; display_name: string }>> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=pt-BR&viewbox=-46.6,-23.7,-46.1,-24.1&bounded=1`,
      { headers: { 'User-Agent': 'DNA-Baixada-App/1.0' } }
    );
    const data = await res.json();
    return data.map(
      (r: { lat: string; lon: string; display_name: string }) => ({
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        display_name: r.display_name,
      })
    );
  } catch {
    return [];
  }
}

// ── Click handler component ──
function MapClickHandler({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ── Main RouteMap component ──
export default function RouteMap({
  origin,
  destination,
  onOriginChange,
  onDestChange,
}: RouteMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{ lat: number; lng: number; display_name: string }>
  >([]);
  const [searching, setSearching] = useState(false);
  const [searchTarget, setSearchTarget] = useState<'origin' | 'destination'>(
    'origin'
  );
  const [routeLine, setRouteLine] = useState<[number, number][]>([]);
  const clickModeRef = useRef<'origin' | 'destination'>('origin');
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Determine next click target
  useEffect(() => {
    if (!origin) clickModeRef.current = 'origin';
    else if (!destination) clickModeRef.current = 'destination';
  }, [origin, destination]);

  // Build simple route line when both points exist
  useEffect(() => {
    if (origin && destination) {
      // Simple straight line (could be enhanced with OSRM routing later)
      setRouteLine([
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ]);
    } else {
      setRouteLine([]);
    }
  }, [origin, destination]);

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      const mode = clickModeRef.current;
      const address = await reverseGeocode(lat, lng);

      if (mode === 'origin' || !origin) {
        onOriginChange(lat, lng, address);
        clickModeRef.current = 'destination';
      } else {
        onDestChange(lat, lng, address);
        clickModeRef.current = 'origin';
      }
    },
    [origin, onOriginChange, onDestChange]
  );

  const handleSearch = useCallback(
    async (query: string) => {
      if (query.length < 3) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      const results = await forwardGeocode(query);
      setSearchResults(results);
      setSearching(false);
    },
    []
  );

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => handleSearch(value), 500);
  };

  const selectSearchResult = async (result: {
    lat: number;
    lng: number;
    display_name: string;
  }) => {
    if (searchTarget === 'origin' || !origin) {
      onOriginChange(result.lat, result.lng, result.display_name);
      setSearchTarget('destination');
    } else {
      onDestChange(result.lat, result.lng, result.display_name);
      setSearchTarget('origin');
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <div className="flex gap-2">
          <select
            value={searchTarget}
            onChange={(e) =>
              setSearchTarget(e.target.value as 'origin' | 'destination')
            }
            className="rounded-lg border border-border bg-surface-elevated px-2 py-2 text-xs font-semibold text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
          >
            <option value="origin">Origem</option>
            <option value="destination">Destino</option>
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Buscar endereço na Baixada..."
            className="flex-1 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none"
          />
          {searching && (
            <div className="absolute right-3 top-2.5">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-secondary/20 border-t-secondary" />
            </div>
          )}
        </div>

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-surface-elevated shadow-lg max-h-48 overflow-y-auto">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => selectSearchResult(result)}
                className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-secondary/5 transition-colors border-b border-border/50 last:border-0"
              >
                <span className="font-medium">{result.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-border shadow-sm sm:h-80">
        <MapContainer
          center={SANTOS_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onSelect={handleMapClick} />

          {origin && (
            <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
              <Popup>
                <span className="text-xs font-semibold text-green-700">
                  🟢 Origem
                </span>
              </Popup>
            </Marker>
          )}

          {destination && (
            <Marker
              position={[destination.lat, destination.lng]}
              icon={destinationIcon}
            >
              <Popup>
                <span className="text-xs font-semibold text-red-700">
                  🔴 Destino
                </span>
              </Popup>
            </Marker>
          )}

          {routeLine.length === 2 && (
            <Polyline
              positions={routeLine}
              pathOptions={{
                color: '#0A2463',
                weight: 3,
                opacity: 0.7,
                dashArray: '8, 8',
              }}
            />
          )}
        </MapContainer>
      </div>

      <p className="text-[11px] text-foreground-muted text-center">
        Clique no mapa para definir{' '}
        {clickModeRef.current === 'origin' || !origin
          ? 'a origem'
          : 'o destino'}{' '}
        · Ou use a busca acima
      </p>
    </div>
  );
}
