import { useMemo } from 'react';
import { Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../../../lib/api';

type RiskLevel = 'extremo' | 'alto' | 'medio' | 'baixo';

export interface FireData {
  id: string;
  codigo: string;
  municipio: string;
  uf: string;
  risco: RiskLevel;
  frp: number;
  lat: number;
  lng: number;
  hectares: number;
  bioma: string;
  totalFocos: number;
  focos?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    frp: number;
  }>;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  extremo: '#f97316', // --fire
  alto:    '#eab308', // --warning
  medio:   '#3b82f6', // --command
  baixo:   '#22c55e', // --success
};

const RISK_LABELS: Record<RiskLevel, string> = {
  extremo: 'EXTREMO',
  alto:    'ALTO',
  medio:   'MÉDIO',
  baixo:   'BAIXO',
};

function createFireIcon(risco: RiskLevel): L.DivIcon {
  const color = RISK_COLORS[risco];
  const size = risco === 'extremo' ? 20 : risco === 'alto' ? 18 : 16;
  return L.divIcon({
    className: 'fire-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <span style="
          display:flex;align-items:center;justify-content:center;
          width:100%;height:100%;border-radius:50%;
          background:${color};
          box-shadow:0 0 12px 3px ${color}aa, 0 0 24px 6px ${color}66;
          border:2px solid rgba(0,0,0,0.6);
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
          </svg>
        </span>
      </div>
    `,
  });
}

interface FireMarkerProps {
  fire: FireData;
  showFocos?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function FireMarker({ fire, showFocos, selected, onSelect }: FireMarkerProps) {
  const icon = useMemo(() => createFireIcon(fire.risco), [fire.risco]);
  const color = RISK_COLORS[fire.risco];
  const navigate = useNavigate();

  // Buscar Ordens de Serviço
  const { data: ordensServico = [] } = useQuery({
    queryKey: ['ordens-servico'],
    queryFn: () => fetchWithAuth('/operacional/os')
  });

  const osVinculada = ordensServico.find((os: any) => os.eventoFogoId === fire.id);

  return (
    <>
      {/* Renderizar Focos de Calor como pequenos pontos vermelhos */}
      {showFocos && fire.focos && fire.focos.map((f) => (
        <CircleMarker
          key={f.id}
          center={[f.latitude, f.longitude]}
          radius={3}
          pathOptions={{ fillColor: '#ef4444', color: '#b91c1c', weight: 1, fillOpacity: 0.8 }}
        >
          <Popup>Foco de calor FRP: {f.frp} MW</Popup>
        </CircleMarker>
      ))}

      <Marker
        position={[fire.lat, fire.lng]}
        icon={icon}
        eventHandlers={{
          click: () => onSelect?.(fire.id),
        }}
      >
        <Popup>
          <div
            style={{
              fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
              fontSize: '11px',
              lineHeight: '1.5',
              color: '#e2e8f0',
              background: '#1a1a2e',
              border: `1px solid ${color}`,
              borderRadius: '8px',
              padding: '12px 14px',
              minWidth: '220px',
              margin: '-14px -20px',
            }}
          >
            <div style={{
              fontWeight: 700,
              fontSize: '14px',
              color,
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 8px ${color}`,
              }} />
              Evento de Fogo
            </div>
            
            <div style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '4px',
              background: `${color}22`,
              color,
              fontWeight: 600,
              fontSize: '11px',
              marginBottom: '8px',
              border: `1px solid ${color}44`,
            }}>
              {RISK_LABELS[fire.risco]} · {fire.totalFocos} Focos
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px 12px',
              fontSize: '11px',
              marginBottom: '12px',
            }}>
              <span style={{ color: '#64748b' }}>FRP Total</span>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{fire.frp.toFixed(2)} MW</span>
              <span style={{ color: '#64748b' }}>Coord</span>
              <span style={{ color: '#e2e8f0' }}>
                {fire.lat.toFixed(4)}, {fire.lng.toFixed(4)}
              </span>
            </div>

            {/* Ação de Despachar OS */}
            <div style={{ borderTop: '1px solid #334155', paddingTop: '10px', marginTop: '10px' }}>
              {osVinculada ? (
                <button
                  onClick={() => navigate({ to: '/ordens-servico', search: { highlightId: osVinculada.id } })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '11px'
                  }}
                >
                  Visualizar OS #{osVinculada.id}
                </button>
              ) : (
                <button
                  onClick={() => navigate({ to: '/ordens-servico', search: { novoParaEvento: fire.id } })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#f97316',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '11px'
                  }}
                >
                  Despachar OS
                </button>
              )}
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
}
