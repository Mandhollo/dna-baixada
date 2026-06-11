'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Types ──
export interface LiveTrackLatLng {
  lat: number;
  lng: number;
}

export interface LiveTrackMapProps {
  origin: LiveTrackLatLng;
  destination: LiveTrackLatLng;
  driverLocation?: LiveTrackLatLng | null;
  status: string;
  etaMinutes?: number | null;
}

// ── Icons ──
const SHADOW_URL =
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';

const originIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: SHADOW_URL,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const destinationIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: SHADOW_URL,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom yellow/gold driver marker using divIcon for pulsing animation
function createDriverIcon(): L.DivIcon {
  return L.divIcon({
    className: 'driver-marker-wrapper',
    html: `
      <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
        <div style="
          position:absolute;
          width:40px;height:40px;
          border-radius:50%;
          background:rgba(234,179,8,0.3);
          animation:driver-pulse 2s ease-in-out infinite;
        "></div>
        <div style="
          width:24px;height:24px;
          border-radius:50%;
          background:#EAB308;
          border:3px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
          font-size:12px;
          z-index:1;
        ">🚗</div>
      </div>
      <style>
        @keyframes driver-pulse {
          0%   { transform:scale(0.8); opacity:0.8; }
          50%  { transform:scale(1.4); opacity:0.2; }
          100% { transform:scale(0.8); opacity:0.8; }
        }
      </style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

const driverIcon = createDriverIcon();

// ── Fit bounds helper ──
function FitBoundsOnLoad({
  origin,
  destination,
}: {
  origin: LiveTrackLatLng;
  destination: LiveTrackLatLng;
}) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (!fitted.current) {
      const bounds = L.latLngBounds(
        L.latLng(origin.lat, origin.lng),
        L.latLng(destination.lat, destination.lng),
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      fitted.current = true;
    }
  }, [map, origin, destination]);

  return null;
}

// ── Route interpolation ──
function interpolate(
  origin: LiveTrackLatLng,
  destination: LiveTrackLatLng,
  progress: number,
): LiveTrackLatLng {
  return {
    lat: origin.lat + (destination.lat - origin.lat) * progress,
    lng: origin.lng + (destination.lng - origin.lng) * progress,
  };
}

// Generate intermediate points for a smoother route line
function generateRoutePoints(
  origin: LiveTrackLatLng,
  destination: LiveTrackLatLng,
  steps: number = 50,
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push([
      origin.lat + (destination.lat - origin.lat) * t,
      origin.lng + (destination.lng - origin.lng) * t,
    ]);
  }
  return points;
}

// ── Traveled path component ──
function TraveledPath({
  origin,
  driverLocation,
  destination,
}: {
  origin: LiveTrackLatLng;
  driverLocation: LiveTrackLatLng;
  destination: LiveTrackLatLng;
}) {
  // Compute how far along the route the driver is
  const totalDist = Math.sqrt(
    Math.pow(destination.lat - origin.lat, 2) +
      Math.pow(destination.lng - origin.lng, 2),
  );
  const driverDist = Math.sqrt(
    Math.pow(driverLocation.lat - origin.lat, 2) +
      Math.pow(driverLocation.lng - origin.lng, 2),
  );
  const progress = totalDist > 0 ? Math.min(driverDist / totalDist, 1) : 0;

  const steps = Math.max(Math.round(progress * 50), 2);
  const traveledPoints: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    traveledPoints.push([
      origin.lat + (driverLocation.lat - origin.lat) * t,
      origin.lng + (driverLocation.lng - origin.lng) * t,
    ]);
  }

  return (
    <Polyline
      positions={traveledPoints}
      pathOptions={{
        color: '#EAB308',
        weight: 4,
        opacity: 0.8,
      }}
    />
  );
}

// ── Animated driver marker ──
function AnimatedDriver({
  origin,
  destination,
  status,
  driverLocation,
  etaMinutes,
}: {
  origin: LiveTrackLatLng;
  destination: LiveTrackLatLng;
  status: string;
  driverLocation?: LiveTrackLatLng | null;
  etaMinutes?: number | null;
}) {
  const markerRef = useRef<L.Marker>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  const getPosition = useCallback(
    (progress: number): [number, number] => {
      const pos = interpolate(origin, destination, progress);
      return [pos.lat, pos.lng];
    },
    [origin, destination],
  );

  useEffect(() => {
    if (status !== 'em_andamento') {
      // If not in progress, just show at origin
      return;
    }

    const ANIMATION_DURATION = 60000; // 60s for full route simulation

    function animate() {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      if (markerRef.current) {
        markerRef.current.setLatLng(getPosition(progress));
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [status, origin, destination, getPosition]);

  // For non-animated states, determine position
  const initialPosition: [number, number] =
    driverLocation && driverLocation.lat && driverLocation.lng
      ? [driverLocation.lat, driverLocation.lng]
      : status === 'em_andamento'
        ? getPosition(0)
        : status === 'aceita'
          ? [origin.lat, origin.lng]
          : [origin.lat, origin.lng];

  return (
    <Marker ref={markerRef} position={initialPosition} icon={driverIcon}>
      <Popup>
        <div className="text-center">
          <p className="text-xs font-bold text-yellow-600">🚗 Motorista</p>
          {status === 'em_andamento' && (
            <p className="text-[11px] text-gray-500 mt-1">
              {etaMinutes ? `ETA: ~${etaMinutes} min` : 'A caminho...'}
            </p>
          )}
          {status === 'aceita' && (
            <p className="text-[11px] text-gray-500 mt-1">
              Aguardando início da corrida
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

// ── Main LiveTrackMap Component ──
export default function LiveTrackMap({
  origin,
  destination,
  driverLocation,
  status,
  etaMinutes,
}: LiveTrackMapProps) {
  const routePoints = generateRoutePoints(origin, destination);

  // Determine center point between origin and destination
  const center: [number, number] = [
    (origin.lat + destination.lat) / 2,
    (origin.lng + destination.lng) / 2,
  ];

  const isActive = status === 'em_andamento' || status === 'aceita';

  return (
    <div className="relative">
      {/* Status overlay */}
      {status === 'em_andamento' && (
        <div className="absolute top-3 left-3 z-[1000] rounded-xl bg-yellow-500/90 px-3 py-1.5 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            <span className="text-xs font-bold text-white">AO VIVO</span>
          </div>
        </div>
      )}

      {etaMinutes && status === 'em_andamento' && (
        <div className="absolute top-3 right-3 z-[1000] rounded-xl bg-white/90 px-3 py-1.5 shadow-md backdrop-blur-sm">
          <p className="text-xs font-bold text-gray-800">
            ⏱ ~{etaMinutes} min
          </p>
        </div>
      )}

      <div className="h-72 w-full overflow-hidden rounded-2xl border border-border shadow-sm sm:h-80">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBoundsOnLoad origin={origin} destination={destination} />

          {/* Route line (dashed blue) */}
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: '#3B82F6',
              weight: 3,
              opacity: 0.5,
              dashArray: '8, 12',
            }}
          />

          {/* Traveled path (solid yellow) */}
          {status === 'em_andamento' && driverLocation && (
            <TraveledPath
              origin={origin}
              driverLocation={driverLocation}
              destination={destination}
            />
          )}

          {/* Origin marker (green) */}
          <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
            <Popup>
              <span className="text-xs font-semibold text-green-700">
                🟢 Origem
              </span>
            </Popup>
          </Marker>

          {/* Destination marker (red) */}
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

          {/* Driver marker (animated yellow/gold) */}
          {isActive && (
            <AnimatedDriver
              origin={origin}
              destination={destination}
              status={status}
              driverLocation={driverLocation}
              etaMinutes={etaMinutes}
            />
          )}

          {/* Driver accuracy circle when we have location */}
          {status === 'em_andamento' && driverLocation && (
            <CircleMarker
              center={[driverLocation.lat, driverLocation.lng]}
              radius={20}
              pathOptions={{
                color: '#EAB308',
                fillColor: '#EAB308',
                fillOpacity: 0.08,
                weight: 1,
                opacity: 0.3,
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
