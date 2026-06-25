import 'leaflet/dist/leaflet.css';

import { useEffect, useState, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  GeoJSON,
  LayersControl,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchWithAuth } from '../../../lib/api';
import { AlertTriangle, ExternalLink } from 'lucide-react';

const MAP_CENTER: [number, number] = [-14.235, -51.925];
const MAP_ZOOM = 4;

const RISK_COLORS: Record<string, string> = {
  extremo: '#f97316',
  alto: '#eab308',
  medio: '#3b82f6',
  baixo: '#22c55e',
};

const RISK_LABELS: Record<string, string> = {
  extremo: 'EXTREMO',
  alto: 'ALTO',
  medio: 'MÉDIO',
  baixo: 'BAIXO',
};

const legendItems = [
  { id: 'extremo', label: 'Extremo · FRP ≥ 300', color: '#f97316' },
  { id: 'alto', label: 'Alto · FRP 100–300', color: '#eab308' },
  { id: 'medio', label: 'Médio · FRP 50–100', color: '#3b82f6' },
  { id: 'baixo', label: 'Baixo · FRP < 50', color: '#22c55e' },
];

function computeRisk(e: any): string {
  if (e.status === 'ATIVO_SEVERO' || e.frpTotal >= 300) return 'extremo';
  if (e.frpTotal >= 100) return 'alto';
  if (e.frpTotal >= 50) return 'medio';
  return 'baixo';
}

function makePinIcon(color: string) {
  return L.divIcon({
    html: `<svg width="24" height="32" viewBox="0 0 24 32" fill="${color}" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6))"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20S24 21 24 12c0-6.627-5.373-12-12-12zm0 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/></svg>`,
    className: '',
    iconSize: [24, 32],
    iconAnchor: [12, 32],
  });
}

function makeDotIcon(color: string) {
  return L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(0,0,0,0.6);box-shadow:0 0 10px 3px ${color}aa"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

// ── Internal sub-components (must live inside MapContainer) ──────────────────

function MapController({
  onMove,
  onClickMap,
  flyTo,
}: {
  onMove: (c: { lat: number; lng: number; zoom: number }) => void;
  onClickMap?: (lat: number, lng: number) => void;
  flyTo?: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      try { map.invalidateSize(); } catch {}
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    // flyTo removido a pedido do usuário
  }, [flyTo, map]);

  useMapEvents({
    move() {
      const c = map.getCenter();
      onMove({ lat: c.lat, lng: c.lng, zoom: map.getZoom() });
    },
    zoom() {
      const c = map.getCenter();
      onMove({ lat: c.lat, lng: c.lng, zoom: map.getZoom() });
    },
    click(e) {
      onClickMap?.(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

function VectorFocosLayer({ visible }: { visible: boolean }) {
  const map = useMap();
  const layerRef = useRef<any>(null);

  useEffect(() => {
    const L_any = L as any;
    if (!visible || !L_any.vectorGrid) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    const layer = L_any.vectorGrid.protobuf(
      'http://localhost:3001/public.tb_focos_calor/{z}/{x}/{y}.pbf',
      {
        vectorTileLayerStyles: {
          'public.tb_focos_calor': {
            weight: 1,
            color: '#b91c1c',
            fill: true,
            fillColor: '#ef4444',
            fillOpacity: 0.8,
            radius: 3,
          },
        },
        interactive: false,
        maxNativeZoom: 14,
      }
    );
    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [visible, map]);

  return null;
}

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  selectedId?: string;
  onSelect?: (id: string) => void;
  onClickMap?: (lat: number, lng: number) => void;
  activePin?: { lat: number; lng: number } | null;
  hideEvents?: boolean;
  flyTo?: { lat: number; lng: number } | null;
  center?: { lat: number; lng: number } | null;
  isolatedEventId?: string;
  dispatchPin?: { lat: number; lng: number } | null;
  extraMarkers?: { lat: number; lng: number; color?: string; tooltip?: string }[];
}

// ── Main component ───────────────────────────────────────────────────────────

export default function SituationMapClient({
  selectedId,
  onSelect,
  onClickMap,
  activePin,
  hideEvents,
  flyTo,
  center,
  isolatedEventId,
  dispatchPin,
  extraMarkers,
}: Props) {
  const effectiveFlyTo = flyTo ?? center;
  const [coords, setCoords] = useState({ lat: MAP_CENTER[0], lng: MAP_CENTER[1], zoom: MAP_ZOOM });
  const [showFocos, setShowFocos] = useState(false);
  const [activeRisks, setActiveRisks] = useState<Record<string, boolean>>({
    extremo: true, alto: true, medio: true, baixo: true,
  });
  const [geoData, setGeoData] = useState<any>(null);
  const navigate = useNavigate();

  const { data: focos = [] } = useQuery({
    queryKey: ['focos-ativos'],
    queryFn: () => fetch('/api/v1/fire-events/active').then(r => r.json()),
    enabled: !hideEvents,
  });

  const { data: ordensServico = [] } = useQuery({
    queryKey: ['ordens-servico'],
    queryFn: () => fetchWithAuth('/operacional/os'),
  });

  useEffect(() => {
    fetch('/brazil-states.json').then(r => r.json()).then(setGeoData).catch(console.error);
  }, []);

  const filteredFocos = useMemo(() => {
    return focos
      .filter((e: any) => (isolatedEventId ? String(e.id) === String(isolatedEventId) : true))
      .map((e: any) => ({ ...e, risco: computeRisk(e) }))
      .filter((e: any) => activeRisks[e.risco]);
  }, [focos, activeRisks, isolatedEventId]);

  const brazilStyle = {
    color: '#10b981',
    weight: 1.5,
    opacity: 0.6,
    fillColor: '#f97316',
    fillOpacity: 0.05,
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        style={{ height: '100%', width: '100%', background: '#0d1117' }}
        attributionControl={false}
        zoomControl={false}
      >
        <MapController onMove={setCoords} onClickMap={onClickMap} flyTo={effectiveFlyTo} />

        {!hideEvents && <VectorFocosLayer visible={showFocos} />}

        <LayersControl>
          <LayersControl.BaseLayer name="🌑 CartoDB Dark">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" maxZoom={20} />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer checked name="🛰️ Google Satellite">
            <TileLayer url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" maxZoom={20} />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🗺️ Google Streets">
            <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" maxZoom={20} />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🌍 OpenStreetMap">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
          </LayersControl.BaseLayer>

          {geoData && (
            <LayersControl.Overlay checked name="🇧🇷 Contorno Brasil">
              <GeoJSON key="brazil" data={geoData} style={() => brazilStyle} />
            </LayersControl.Overlay>
          )}
        </LayersControl>

        {/* Fire event markers */}
        {!hideEvents &&
          filteredFocos.map((e: any) => {
            const color = RISK_COLORS[e.risco] || '#3b82f6';
            const glowRadius = e.risco === 'extremo' ? 24 : e.risco === 'alto' ? 20 : 16;
            const coreRadius = e.risco === 'extremo' ? 10 : e.risco === 'alto' ? 8 : 6;
            const codigo = String(e.id).substring(0, 8).toUpperCase();
            const osVinculada = ordensServico.find((os: any) => os.eventoFogoId === e.id);

            return (
              <span key={e.id}>
                <CircleMarker
                  center={[e.latitude, e.longitude]}
                  radius={glowRadius}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.2, opacity: 0, weight: 0 }}
                  interactive={false}
                />
                <CircleMarker
                  center={[e.latitude, e.longitude]}
                  radius={coreRadius}
                  pathOptions={{ color: '#000', weight: 2, fillColor: color, fillOpacity: 1 }}
                  eventHandlers={{ click: () => onSelect?.(String(e.id)) }}
                >
                  <Popup>
                    <div className="p-3 bg-[#0f172a] rounded-lg border border-slate-800 text-slate-200" style={{ minWidth: 200 }}>
                      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                        <Badge variant="outline" style={{ borderColor: color, color }}>
                          {RISK_LABELS[e.risco]}
                        </Badge>
                        <span className="text-[10px] font-mono text-slate-500">#{codigo}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div>
                          <span className="text-slate-500 block">FRP Total</span>
                          <span className="font-mono font-medium">{Number(e.frpTotal || 0).toFixed(1)} MW</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Focos (Pontos)</span>
                          <span className="font-mono font-medium">{e.totalFocos} pts</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                        {osVinculada ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs h-8 border-command/30 text-command hover:bg-command/10"
                            onClick={() => navigate({ to: `/ordens-servico/${osVinculada.id}` as any })}
                          >
                            <ExternalLink className="mr-2 h-3 w-3" />
                            Visualizar OS Vinculada
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full text-xs h-8 bg-fire hover:bg-fire/90 text-white"
                            onClick={() => navigate({ to: '/ordens-servico/nova', search: { eventoFogoId: e.id } })}
                          >
                            <AlertTriangle className="mr-2 h-3 w-3" />
                            Despachar Nova OS
                          </Button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              </span>
            );
          })}

        {activePin && <Marker position={[activePin.lat, activePin.lng]} icon={makePinIcon('#ef4444')} />}
        {dispatchPin && <Marker position={[dispatchPin.lat, dispatchPin.lng]} icon={makePinIcon('#3b82f6')} />}
        {extraMarkers?.map((m, i) => (
          <Marker key={i} position={[m.lat, m.lng]} icon={makeDotIcon(m.color || '#f59e0b')}>
            {m.tooltip && <Popup><span className="text-xs">{m.tooltip}</span></Popup>}
          </Marker>
        ))}
      </MapContainer>

      {/* HUD */}
      <div className="absolute top-3 right-14 z-[1000] glass rounded-lg px-2.5 py-1.5 text-[10px] mono text-muted-foreground flex items-center gap-2 pointer-events-none">
        <svg className="h-3.5 w-3.5 text-command" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
        </svg>
        <span>LAT {coords.lat.toFixed(2)}° · LNG {coords.lng.toFixed(2)}°</span>
        <span className="text-border">|</span>
        <span>ZOOM {coords.zoom.toFixed(1)}</span>
      </div>

      {/* Focos individuais toggle */}
      {!hideEvents && (
        <button
          type="button"
          onClick={() => setShowFocos(v => !v)}
          className={`absolute bottom-14 left-3 z-[1000] px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
            showFocos
              ? 'bg-red-600 border-red-700 text-white'
              : 'glass border-slate-700 text-slate-300 hover:bg-slate-800/60'
          }`}
        >
          {showFocos ? '🔥 Ocultar Focos Individuais' : '🔥 Mostrar Focos Individuais'}
        </button>
      )}

      {/* Legend */}
      {!hideEvents && (
        <div className="absolute bottom-3 left-3 z-[1000] glass rounded-lg px-2.5 py-2 text-[10px] mono space-y-1">
          {legendItems.map(item => {
            const isActive = activeRisks[item.id];
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setActiveRisks(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity"
                style={{ opacity: isActive ? 1 : 0.4 }}
              >
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ background: item.color, boxShadow: isActive ? `0 0 6px ${item.color}88` : 'none' }}
                />
                <span className={isActive ? 'text-slate-200' : 'text-slate-500'}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

    
    </div>
  );
}
