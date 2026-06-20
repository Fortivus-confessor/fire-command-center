import 'maplibre-gl/dist/maplibre-gl.css';

import { useCallback, useEffect, useState } from 'react';
import Map, { Source, Layer, NavigationControl, Marker } from 'react-map-gl/maplibre';
import { FireMarker, type FireData } from './FireMarker';
import { useQuery } from '@tanstack/react-query';

const MAP_CENTER = { longitude: -51.925, latitude: -14.235, zoom: 4 };

const legendItems = [
  { label: 'Extremo · FRP > 300', color: '#f97316' },
  { label: 'Alto · FRP 100–300',  color: '#eab308' },
  { label: 'Médio',               color: '#3b82f6' },
  { label: 'Baixo',               color: '#22c55e' },
];

interface Props {
  selectedId?: string;
  onSelect?: (id: string) => void;
  onClickMap?: (lat: number, lng: number) => void;
  activePin?: { lat: number; lng: number } | null;
  hideEvents?: boolean;
  flyTo?: { lat: number; lng: number } | null;
}

export default function SituationMapClient({ selectedId, onSelect, onClickMap, activePin, hideEvents, flyTo }: Props) {
  const [coords, setCoords] = useState({ lat: MAP_CENTER.latitude, lng: MAP_CENTER.longitude, zoom: MAP_CENTER.zoom });
  const [showFocos, setShowFocos] = useState(false);
  const [geoData, setGeoData] = useState<any>(null);

  const { data: focos = [] } = useQuery({
    queryKey: ['focos-ativos'],
    queryFn: () => fetch('/api/v1/fire-events/active').then(res => res.json()),
    enabled: !hideEvents
  });

  useEffect(() => {
    fetch('/brazil-states.json')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(console.error);
  }, []);

  const handleMove = useCallback((evt: any) => {
    setCoords({
      lat: evt.viewState.latitude,
      lng: evt.viewState.longitude,
      zoom: evt.viewState.zoom
    });
  }, []);

  const handleClick = useCallback((evt: any) => {
    onClickMap?.(evt.lngLat.lat, evt.lngLat.lng);
  }, [onClickMap]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border">
      <Map
        initialViewState={MAP_CENTER}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        onMove={handleMove}
        onClick={handleClick}
      >
        <NavigationControl position="top-right" />

        {/* ── Brazil overlay ──────────────────────── */}
        {geoData && (
          <Source id="brazil" type="geojson" data={geoData}>
            <Layer
              id="brazil-line"
              type="line"
              paint={{
                'line-color': '#f97316',
                'line-width': 2,
                'line-dasharray': [6, 3],
                'line-opacity': 0.7
              }}
            />
            <Layer
              id="brazil-fill"
              type="fill"
              paint={{
                'fill-color': '#f97316',
                'fill-opacity': 0.05
              }}
            />
          </Source>
        )}

        {/* ── Martin GIS MVT Layer para Focos Individuais ────────── */}
        {!hideEvents && showFocos && (
          <Source 
            id="martin-focos" 
            type="vector" 
            url="http://localhost:3001/public.tb_focos_calor.json"
          >
            <Layer
              id="focos-calor"
              type="circle"
              source-layer="public.tb_focos_calor"
              paint={{
                'circle-radius': 3,
                'circle-color': '#ef4444',
                'circle-opacity': 0.8,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#b91c1c'
              }}
            />
          </Source>
        )}

        {!hideEvents && (
          <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
            <button
              onClick={() => setShowFocos(!showFocos)}
              style={{
                background: showFocos ? '#ef4444' : '#1e293b',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #334155',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              {showFocos ? '🔥 Ocultar Focos Individuais' : '🔥 Mostrar Focos Individuais'}
            </button>
          </div>
        )}

        {/* ── Fire markers (Eventos) ───────────────────────────── */}
        {!hideEvents && focos.map((e: any) => {
          let riscoLocal = 'medio';
          if (e.status === 'ATIVO_SEVERO' || e.frpTotal > 300) riscoLocal = 'extremo';
          else if (e.frpTotal > 100) riscoLocal = 'alto';
          else if (e.frpTotal < 20) riscoLocal = 'baixo';

          const fire = {
            id: e.id,
            codigo: e.id.substring(0,8).toUpperCase(),
            municipio: 'Brasil',
            uf: 'BR',
            risco: riscoLocal,
            frp: e.frpTotal || 0,
            latitude: e.latitude,
            longitude: e.longitude,
            hectares: e.totalFocos * 5,
            bioma: 'N/A',
            totalFocos: e.totalFocos
          };
          
          return (
            <FireMarker 
              key={e.id} 
              fire={fire as any} 
              selected={selectedId === e.id} 
              onSelect={onSelect}
            />
          );
        })}

        {activePin && (
          <Marker longitude={activePin.lng} latitude={activePin.lat} color="red" />
        )}
      </Map>

      {/* ── HUD ──────────────── */}
      <div className="absolute top-3 right-12 z-[10] glass rounded-lg px-2.5 py-1.5 text-[10px] mono text-muted-foreground flex items-center gap-2 pointer-events-none">
        <svg className="h-3.5 w-3.5 text-command" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
        </svg>
        <span>LAT {coords.lat.toFixed(2)}° · LNG {coords.lng.toFixed(2)}°</span>
        <span className="text-border">|</span>
        <span>ZOOM {coords.zoom.toFixed(1)}</span>
      </div>

      {!hideEvents && (
        <div className="absolute bottom-3 left-3 z-[10] glass rounded-lg px-2.5 py-2 text-[10px] mono space-y-1 pointer-events-none">
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

      <div className="absolute bottom-3 right-3 z-[10] glass rounded-lg px-2.5 py-1.5 text-[10px] mono text-muted-foreground pointer-events-none">
        Fonte: MapLibre / INPE · t-00:02:14
      </div>
    </div>
  );
}
