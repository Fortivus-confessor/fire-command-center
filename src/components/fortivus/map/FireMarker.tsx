import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

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
  const size = risco === 'extremo' ? 16 : risco === 'alto' ? 14 : 12;
  const pulseRing = risco === 'extremo'
    ? `<span style="
        position:absolute;inset:-6px;border-radius:50%;
        border:2px solid ${color};opacity:.6;
        animation:fireMarkerPulse 2s infinite;
      "></span>`
    : '';

  return L.divIcon({
    className: 'fire-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${pulseRing}
        <span style="
          display:block;width:100%;height:100%;border-radius:50%;
          background:${color};
          box-shadow:0 0 10px 2px ${color}88, 0 0 20px 4px ${color}44;
          border:2px solid rgba(0,0,0,0.4);
        "></span>
      </div>
    `,
  });
}

interface FireMarkerProps {
  fire: FireData;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function FireMarker({ fire, selected, onSelect }: FireMarkerProps) {
  const icon = useMemo(() => createFireIcon(fire.risco), [fire.risco]);
  const color = RISK_COLORS[fire.risco];

  return (
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
            padding: '10px 12px',
            minWidth: '200px',
            margin: '-14px -20px',
          }}
        >
          <div style={{
            fontWeight: 700,
            fontSize: '13px',
            color,
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 6px ${color}`,
            }} />
            {fire.codigo}
          </div>
          <div style={{ color: '#94a3b8', marginBottom: '2px' }}>
            {fire.municipio}/{fire.uf}
          </div>
          <div style={{
            display: 'inline-block',
            padding: '1px 6px',
            borderRadius: '4px',
            background: `${color}22`,
            color,
            fontWeight: 600,
            fontSize: '10px',
            marginBottom: '6px',
            border: `1px solid ${color}44`,
          }}>
            {RISK_LABELS[fire.risco]}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2px 12px',
            fontSize: '10px',
          }}>
            <span style={{ color: '#64748b' }}>FRP</span>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{fire.frp} MW</span>
            <span style={{ color: '#64748b' }}>Área</span>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{fire.hectares} ha</span>
            <span style={{ color: '#64748b' }}>Bioma</span>
            <span style={{ color: '#e2e8f0' }}>{fire.bioma}</span>
            <span style={{ color: '#64748b' }}>Coord</span>
            <span style={{ color: '#e2e8f0' }}>
              {fire.lat.toFixed(4)}, {fire.lng.toFixed(4)}
            </span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
