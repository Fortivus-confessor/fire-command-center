import 'leaflet/dist/leaflet.css';

import { useCallback, useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  LayersControl,
  useMapEvents,
  Marker
} from 'react-leaflet';
import L from 'leaflet';

import { FireMarker, type FireData } from './FireMarker';
import { VectorTileLayer } from './VectorTileLayer';

const pinIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

/* ── Inject marker styles ──────────────────────────────────────── */
const MARKER_STYLES = `
  .fire-marker-icon {
    background: none !important;
    border: none !important;
  }
  @keyframes fireMarkerPulse {
    0%   { transform: scale(1);   opacity: 0.7; }
    50%  { transform: scale(1.8); opacity: 0; }
    100% { transform: scale(1);   opacity: 0; }
  }

  /* Override Leaflet popup styles for dark theme */
  .leaflet-popup-content-wrapper {
    background: transparent !important;
    box-shadow: none !important;
    border-radius: 8px !important;
    padding: 0 !important;
  }
  .leaflet-popup-content {
    margin: 0 !important;
  }
  .leaflet-popup-tip {
    background: #1a1a2e !important;
    box-shadow: none !important;
  }
  .leaflet-popup-close-button {
    color: #64748b !important;
    font-size: 18px !important;
    top: 4px !important;
    right: 6px !important;
  }
  .leaflet-popup-close-button:hover {
    color: #e2e8f0 !important;
  }

  /* Dark-themed Leaflet controls */
  .leaflet-control-layers {
    background: color-mix(in oklab, oklch(0.21 0.014 260) 85%, transparent) !important;
    backdrop-filter: blur(12px) saturate(140%) !important;
    border: 1px solid oklch(0.30 0.018 260 / 60%) !important;
    border-radius: 8px !important;
    color: #e2e8f0 !important;
    font-family: ui-monospace, "JetBrains Mono", monospace !important;
    font-size: 11px !important;
    padding: 6px 10px !important;
  }
  .leaflet-control-layers-toggle {
    width: 32px !important;
    height: 32px !important;
    background-size: 18px 18px !important;
    background-color: color-mix(in oklab, oklch(0.21 0.014 260) 85%, transparent) !important;
    backdrop-filter: blur(12px) !important;
    border: 1px solid oklch(0.30 0.018 260 / 60%) !important;
    border-radius: 8px !important;
  }
  .leaflet-control-layers-separator {
    border-color: oklch(0.30 0.018 260 / 40%) !important;
  }
  .leaflet-control-layers label {
    color: #cbd5e1 !important;
  }
  .leaflet-control-layers label span {
    color: #cbd5e1 !important;
  }

  /* Zoom controls */
  .leaflet-control-zoom a {
    background: color-mix(in oklab, oklch(0.21 0.014 260) 85%, transparent) !important;
    backdrop-filter: blur(12px) !important;
    border: 1px solid oklch(0.30 0.018 260 / 60%) !important;
    color: #e2e8f0 !important;
    width: 32px !important;
    height: 32px !important;
    line-height: 30px !important;
    font-size: 16px !important;
  }
  .leaflet-control-zoom a:hover {
    background: color-mix(in oklab, oklch(0.26 0.018 260) 90%, transparent) !important;
  }
  .leaflet-control-zoom {
    border: none !important;
    border-radius: 8px !important;
    overflow: hidden;
  }

  /* Attribution */
  .leaflet-control-attribution {
    display: none !important;
  }
`;

import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../../../lib/api';

/* ── Map center & defaults ─────────────────────────────────────── */
const MAP_CENTER: [number, number] = [-14.235, -51.925];
const MAP_ZOOM = 4;

/* ── Cursor coordinate tracker & Click ───────────────── */
function MapInteractions({ onChange, onClick }: { onChange: (lat: number, lng: number, zoom: number) => void, onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    mousemove(e) {
      onChange(e.latlng.lat, e.latlng.lng, e.target.getZoom());
    },
    zoom(e) {
      const center = e.target.getCenter();
      onChange(center.lat, center.lng, e.target.getZoom());
    },
    click(e) {
      onClick?.(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

/* ── GeoJSON style ─────────────────────────────────────────────── */
const brazilStyle = {
  color: '#f97316',
  weight: 2,
  opacity: 0.7,
  fillColor: '#f97316',
  fillOpacity: 0.05,
  dashArray: '6 3',
};

/* ── Legend items ───────────────────────────────────────────────── */
const legendItems = [
  { label: 'Extremo · FRP > 300', color: '#f97316' },
  { label: 'Alto · FRP 100–300',  color: '#eab308' },
  { label: 'Médio',               color: '#3b82f6' },
  { label: 'Baixo',               color: '#22c55e' },
];

/* ── Main Component ────────────────────────────────────────────── */
interface Props {
  selectedId?: string;
  onSelect?: (id: string) => void;
  onClickMap?: (lat: number, lng: number) => void;
  activePin?: { lat: number; lng: number } | null;
  hideEvents?: boolean;
  flyTo?: { lat: number; lng: number } | null;
}

function FlyToHelper({ center }: { center: { lat: number, lng: number } | null }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], 13);
    }
  }, [center, map]);
  return null;
}

export default function SituationMapClient({ selectedId, onSelect, onClickMap, activePin, hideEvents, flyTo }: Props) {
  const [coords, setCoords] = useState({ lat: MAP_CENTER[0] as number, lng: MAP_CENTER[1] as number, zoom: MAP_ZOOM });
  const [geoData, setGeoData] = useState<any>(null);
  const { data: focos = [] } = useQuery({
    queryKey: ['focos'],
    queryFn: () => fetchWithAuth('/focos/ativos'),
    enabled: !hideEvents
  });

  const handleCoordsChange = useCallback((lat: number, lng: number, zoom: number) => {
    setCoords({ lat, lng, zoom });
  }, []);

  // Fetch Brazil High-Res GeoJSON
  useEffect(() => {
    fetch('/brazil-states.json')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(console.error);
  }, []);

  // Inject styles once
  useEffect(() => {
    const id = 'fire-marker-styles';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = MARKER_STYLES;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        minZoom={3}
        maxZoom={18}
        zoomControl={true}
        style={{ height: '100%', width: '100%', background: '#0d1117' }}
      >
        {/* ── Tile layers ────────────────────────────── */}
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="🛰️ Google Satellite">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🗺️ Google Streets">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🌍 OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🌑 CartoDB Dark">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={20}
            />
          </LayersControl.BaseLayer>

          {/* ── Brazil overlay ──────────────────────── */}
          <LayersControl.Overlay checked name="🇧🇷 Contorno Brasil">
            {geoData && <GeoJSON key="brazil" data={geoData} style={brazilStyle} />}
          </LayersControl.Overlay>

          {/* ── NASA FIRMS Fire Events (Martin GIS) ── */}
          {!hideEvents && (
            <LayersControl.Overlay checked name="🔥 Focos de Calor (Tempo Real)">
              <VectorTileLayer url="http://localhost:3001/fire_event/{z}/{x}/{y}.pbf" layerName="fire_event" />
            </LayersControl.Overlay>
          )}
        </LayersControl>

        {/* ── Fire markers ───────────────────────────── */}
        {!hideEvents && focos.map((f: any) => {
          // Map backend FocoIncendioDTO to local FireData structure for the FireMarker component
          const fire = {
            id: f.id,
            codigo: f.codigoInpe || f.id.substring(0,8),
            municipio: f.municipio || 'Desconhecido',
            uf: f.estado || 'BR',
            risco: f.riscoFogo === 'CRITICO' ? 'extremo' : (f.riscoFogo === 'ALTO' ? 'alto' : 'medio'),
            frp: f.frp || 0,
            lat: f.latitude,
            lng: f.longitude,
            hectares: f.areaEstimadaHectares || 0,
            bioma: f.bioma || 'Bioma N/A'
          };
          
          return (
            <FireMarker
              key={fire.id}
              fire={fire as any}
              selected={fire.id === selectedId}
              onSelect={onSelect}
            />
          );
        })}

        {/* ── Map Interactions ─────────────────────── */}
        <MapInteractions onChange={handleCoordsChange} onClick={onClickMap} />
        <FlyToHelper center={flyTo || null} />

        {activePin && (
          <Marker position={[activePin.lat, activePin.lng]} icon={pinIcon} />
        )}
      </MapContainer>

      {/* ── HUD: Coordinates (top-left) ──────────────── */}
      <div className="absolute top-3 left-3 z-[1000] glass rounded-lg px-2.5 py-1.5 text-[10px] mono text-muted-foreground flex items-center gap-2 pointer-events-none">
        <svg className="h-3.5 w-3.5 text-command" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
        </svg>
        <span>LAT {coords.lat.toFixed(2)}° · LNG {coords.lng.toFixed(2)}°</span>
        <span className="text-border">|</span>
        <span>ZOOM {coords.zoom.toFixed(1)}</span>
      </div>

      {/* ── HUD: Legend (bottom-left) ────────────────── */}
      {!hideEvents && (
        <div className="absolute bottom-3 left-3 z-[1000] glass rounded-lg px-2.5 py-2 text-[10px] mono space-y-1 pointer-events-none">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ background: item.color, boxShadow: `0 0 6px ${item.color}88` }}
              />
              <span className="text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── HUD: Source attribution (bottom-right) ────── */}
      <div className="absolute bottom-3 right-3 z-[1000] glass rounded-lg px-2.5 py-1.5 text-[10px] mono text-muted-foreground pointer-events-none">
        Fonte: BDQueimadas / INPE · t-00:02:14
      </div>
    </div>
  );
}
