import 'maplibre-gl/dist/maplibre-gl.css';

import { useCallback, useEffect, useState, useMemo } from 'react';
import Map, { Source, Layer, NavigationControl, Marker, Popup } from 'react-map-gl/maplibre';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchWithAuth } from '../../../lib/api';
import { AlertTriangle, ExternalLink } from 'lucide-react';

const MAP_CENTER = { longitude: -51.925, latitude: -14.235, zoom: 4 };

const legendItems = [
  { label: 'Extremo · FRP > 300', color: '#f97316' },
  { label: 'Alto · FRP 100–300',  color: '#eab308' },
  { label: 'Médio',               color: '#3b82f6' },
  { label: 'Baixo',               color: '#22c55e' },
];

const RISK_LABELS: Record<string, string> = {
  extremo: 'EXTREMO',
  alto:    'ALTO',
  medio:   'MÉDIO',
  baixo:   'BAIXO',
};

const RISK_COLORS: Record<string, string> = {
  extremo: '#f97316',
  alto:    '#eab308',
  medio:   '#3b82f6',
  baixo:   '#22c55e',
};

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
  const [popupInfo, setPopupInfo] = useState<any>(null);
  const navigate = useNavigate();

  const { data: focos = [] } = useQuery({
    queryKey: ['focos-ativos'],
    queryFn: () => fetch('/api/v1/fire-events/active').then(res => res.json()),
    enabled: !hideEvents
  });

  const { data: ordensServico = [] } = useQuery({
    queryKey: ['ordens-servico'],
    queryFn: () => fetchWithAuth('/operacional/os')
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
    const feature = evt.features && evt.features[0];
    if (feature && (feature.layer.id === 'fire-events-core' || feature.layer.id === 'fire-events-glow')) {
      onSelect?.(feature.properties.id);
      setPopupInfo({
        longitude: evt.lngLat.lng,
        latitude: evt.lngLat.lat,
        properties: feature.properties
      });
    } else {
      setPopupInfo(null);
      onClickMap?.(evt.lngLat.lat, evt.lngLat.lng);
    }
  }, [onClickMap, onSelect]);

  const onMouseEnter = useCallback(() => {
    document.body.style.cursor = 'pointer';
  }, []);

  const onMouseLeave = useCallback(() => {
    document.body.style.cursor = '';
  }, []);

  const fireGeojson = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: focos.map((e: any) => {
        let risco = 'medio';
        if (e.status === 'ATIVO_SEVERO' || e.frpTotal > 300) risco = 'extremo';
        else if (e.frpTotal > 100) risco = 'alto';
        else if (e.frpTotal < 20) risco = 'baixo';

        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [e.longitude, e.latitude] },
          properties: {
            id: e.id,
            codigo: e.id.substring(0,8).toUpperCase(),
            risco,
            frp: e.frpTotal || 0,
            totalFocos: e.totalFocos
          }
        };
      })
    };
  }, [focos]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border">
      <Map
        initialViewState={MAP_CENTER}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        onMove={handleMove}
        onClick={handleClick}
        interactiveLayerIds={['fire-events-core', 'fire-events-glow']}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
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

        {/* ── Eventos de Fogo via WebGL Layers ─────────────────── */}
        {!hideEvents && (
          <Source id="fire-events" type="geojson" data={fireGeojson as any}>
            <Layer
              id="fire-events-glow"
              type="circle"
              paint={{
                'circle-radius': [
                  'match', ['get', 'risco'],
                  'extremo', 24,
                  'alto', 20,
                  'medio', 16,
                  'baixo', 16,
                  16
                ],
                'circle-color': [
                  'match', ['get', 'risco'],
                  'extremo', '#f97316',
                  'alto', '#eab308',
                  'medio', '#3b82f6',
                  'baixo', '#22c55e',
                  '#3b82f6'
                ],
                'circle-opacity': 0.3,
                'circle-blur': 0.5
              }}
            />
            <Layer
              id="fire-events-core"
              type="circle"
              paint={{
                'circle-radius': [
                  'match', ['get', 'risco'],
                  'extremo', 10,
                  'alto', 8,
                  'medio', 6,
                  'baixo', 6,
                  6
                ],
                'circle-color': [
                  'match', ['get', 'risco'],
                  'extremo', '#f97316',
                  'alto', '#eab308',
                  'medio', '#3b82f6',
                  'baixo', '#22c55e',
                  '#3b82f6'
                ],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#000000'
              }}
            />
          </Source>
        )}

        {/* ── Popups para Eventos de Fogo ──────────────────────── */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            offset={14}
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
            className="maplibre-dark-popup"
            maxWidth="300px"
          >
            <div className="p-3 bg-[#0f172a] rounded-lg border border-slate-800 text-slate-200">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <Badge variant="outline" style={{ borderColor: RISK_COLORS[popupInfo.properties.risco], color: RISK_COLORS[popupInfo.properties.risco] }}>
                  {RISK_LABELS[popupInfo.properties.risco]}
                </Badge>
                <span className="text-[10px] font-mono text-slate-500">#{popupInfo.properties.codigo}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <span className="text-slate-500 block">FRP Total</span>
                  <span className="font-mono font-medium">{Number(popupInfo.properties.frp).toFixed(1)} MW</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Focos (Pontos)</span>
                  <span className="font-mono font-medium">{popupInfo.properties.totalFocos} pts</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                {ordensServico.find((os: any) => os.eventoFogoId === popupInfo.properties.id) ? (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full text-xs h-8 border-command/30 text-command hover:bg-command/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      const os = ordensServico.find((os: any) => os.eventoFogoId === popupInfo.properties.id);
                      navigate({ to: '/ordens-servico', search: { highlightId: os.id } });
                    }}
                  >
                    <ExternalLink className="mr-2 h-3 w-3" />
                    Visualizar OS Vinculada
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    className="w-full text-xs h-8 bg-fire hover:bg-fire/90 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate({ to: '/ordens-servico', search: { novoParaEvento: popupInfo.properties.id } });
                    }}
                  >
                    <AlertTriangle className="mr-2 h-3 w-3" />
                    Despachar Nova OS
                  </Button>
                )}
              </div>
            </div>
          </Popup>
        )}

        {activePin && (
          <Marker longitude={activePin.lng} latitude={activePin.lat} color="red" />
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
