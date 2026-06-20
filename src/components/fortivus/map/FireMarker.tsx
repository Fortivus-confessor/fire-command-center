import { useMemo, useState } from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre';
import { Flame, AlertTriangle, ShieldAlert, ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api';

export type RiskLevel = 'extremo' | 'alto' | 'medio' | 'baixo';

export interface FireData {
  id: string;
  codigo: string;
  municipio: string;
  uf: string;
  risco: RiskLevel;
  frp: number;
  latitude: number;
  longitude: number;
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
  extremo: '#f97316',
  alto:    '#eab308',
  medio:   '#3b82f6',
  baixo:   '#22c55e',
};

const RISK_LABELS: Record<RiskLevel, string> = {
  extremo: 'EXTREMO',
  alto:    'ALTO',
  medio:   'MÉDIO',
  baixo:   'BAIXO',
};

interface FireMarkerProps {
  fire: FireData;
  showFocos?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function FireMarker({ fire, showFocos, selected, onSelect }: FireMarkerProps) {
  const color = RISK_COLORS[fire.risco];
  const size = fire.risco === 'extremo' ? 36 : fire.risco === 'alto' ? 32 : 28;
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);

  const { data: ordensServico = [] } = useQuery({
    queryKey: ['ordens-servico'],
    queryFn: () => fetchWithAuth('/operacional/os')
  });

  const osVinculada = ordensServico.find((os: any) => os.eventoFogoId === fire.id);

  const handleClick = (e: any) => {
    e.originalEvent.stopPropagation();
    onSelect?.(fire.id);
    setShowPopup(true);
  };

  return (
    <>
      <Marker
        longitude={fire.longitude}
        latitude={fire.latitude}
        anchor="bottom"
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ position: 'relative', width: size, height: size, zIndex: selected ? 100 : 1 }}>
          {fire.risco === 'extremo' && (
            <span style={{
              position: 'absolute', inset: -8, borderRadius: '50%',
              border: `2px solid ${color}`, opacity: 0.6,
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
            }}></span>
          )}
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', height: '100%', borderRadius: '50%',
            background: color,
            boxShadow: `0 0 12px 3px ${color}aa, 0 0 24px 6px ${color}66`,
            border: '2px solid rgba(0,0,0,0.6)'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
          </span>
        </div>
      </Marker>

      {showPopup && (
        <Popup
          longitude={fire.longitude}
          latitude={fire.latitude}
          anchor="bottom"
          offset={[0, -size]}
          onClose={() => setShowPopup(false)}
          closeButton={true}
          closeOnClick={false}
          className="maplibre-dark-popup"
          maxWidth="300px"
        >
          <div className="p-3 bg-[#0f172a] rounded-lg border border-slate-800 text-slate-200">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <Badge variant="outline" style={{ borderColor: color, color }}>
                {RISK_LABELS[fire.risco]}
              </Badge>
              <span className="text-[10px] font-mono text-slate-500">#{fire.codigo}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div>
                <span className="text-slate-500 block">FRP Total</span>
                <span className="font-mono font-medium">{fire.frp.toFixed(1)} MW</span>
              </div>
              <div>
                <span className="text-slate-500 block">Focos (Pontos)</span>
                <span className="font-mono font-medium">{fire.totalFocos} pts</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              {osVinculada ? (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full text-xs h-8 border-command/30 text-command hover:bg-command/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate({ to: '/ordens-servico', search: { highlightId: osVinculada.id } });
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
                    navigate({ to: '/ordens-servico', search: { novoParaEvento: fire.id } });
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
    </>
  );
}
