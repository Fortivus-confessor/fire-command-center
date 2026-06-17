import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Search, Flame, AlertTriangle, TreePine, MapPin, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const Route = createFileRoute('/eventos-fogo')({
  component: EventosFogoPage,
});

import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../lib/api';

// ── Types ──────────────────────────────────────────────
interface EventoFogo {
  id: string;
  externalId: string;
  satellite: string;
  confidence: string;
  frp: number;
  acquisitionDate: string;
  latitude: number;
  longitude: number;
}

// ── Helpers ────────────────────────────────────────────
function riscoBadge(r: string) {
  const norm = (r || '').toLowerCase();
  switch (norm) {
    case 'critico': return <Badge className="bg-fire/20 text-fire border-fire/30 uppercase text-[10px]">Extremo</Badge>;
    case 'alto': return <Badge className="bg-warning/20 text-warning border-warning/30 uppercase text-[10px]">Alto</Badge>;
    case 'medio': return <Badge className="bg-command/20 text-command border-command/30 uppercase text-[10px]">Médio</Badge>;
    case 'baixo': return <Badge className="bg-success/20 text-success border-success/30 uppercase text-[10px]">Baixo</Badge>;
    default: return <Badge variant="secondary">{r || 'N/A'}</Badge>;
  }
}

function timeSince(dateStr: string) {
  if (!dateStr) return '--';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d`;
  if (hours > 0) return `${hours}h`;
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes}min`;
}

// ── Page Component ─────────────────────────────────────
function EventosFogoPage() {
  const { data: eventosData = [] } = useQuery<EventoFogo[]>({
    queryKey: ['focos'],
    queryFn: () => fetch('/api/v1/fire-events/latest').then(res => res.json())
  });

  const [search, setSearch] = useState('');
  const [filterRisco, setFilterRisco] = useState('all');
  const [filterBioma, setFilterBioma] = useState('all');

  const filtered = eventosData.filter((item) => {
    const matchSearch =
      !search ||
      (item.externalId && item.externalId.toLowerCase().includes(search.toLowerCase())) ||
      (item.satellite && item.satellite.toLowerCase().includes(search.toLowerCase()));
    
    const calculatedRisk = item.frp > 100 ? 'extremo' : (item.frp > 50 ? 'alto' : 'medio');
    const matchRisco = filterRisco === 'all' || calculatedRisk === filterRisco;
    return matchSearch && matchRisco;
  });

  // ── KPIs ──
  const totalFocos = eventosData.length;
  const riscoExtremo = eventosData.filter((e) => e.frp > 100).length;
  const altaConfianca = eventosData.filter((e) => e.confidence === 'h' || e.confidence === '100').length;
  const satelitesAtivos = new Set(eventosData.map((e) => e.satellite).filter(Boolean)).size;

  const kpis = [
    { label: 'Total de Focos', value: totalFocos, icon: Flame, color: 'text-fire' },
    { label: 'Risco Extremo (FRP>100)', value: riscoExtremo, icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Alta Confiança', value: altaConfianca, icon: MapPin, color: 'text-warning' },
    { label: 'Satélites na Varredura', value: satelitesAtivos, icon: TreePine, color: 'text-success' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Flame className="h-6 w-6 text-fire" />
          Eventos de Fogo
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitoramento de focos de incêndio detectados via satélite
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold mono">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou município..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterRisco} onValueChange={setFilterRisco}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Risco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Riscos</SelectItem>
              <SelectItem value="extremo">Extremo</SelectItem>
              <SelectItem value="alto">Alto</SelectItem>
              <SelectItem value="medio">Médio</SelectItem>
              <SelectItem value="baixo">Baixo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden glass border border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/40">
              <TableRow>
                <TableHead>Identificador</TableHead>
                <TableHead>Satélite</TableHead>
                <TableHead>Confiança</TableHead>
                <TableHead>Risco</TableHead>
                <TableHead>FRP (MW)</TableHead>
                <TableHead>Detectado há</TableHead>
                <TableHead>Latitude</TableHead>
                <TableHead>Longitude</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum evento detectado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-secondary/20 transition">
                    <TableCell className="mono font-medium">{item.externalId ? item.externalId.substring(0, 15) + '...' : item.id.substring(0,8)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground mono">{item.satellite}</TableCell>
                    <TableCell>{item.confidence}</TableCell>
                    <TableCell>{riscoBadge(item.frp > 100 ? 'critico' : (item.frp > 50 ? 'alto' : 'medio'))}</TableCell>
                    <TableCell className="mono font-bold text-fire">{item.frp != null ? item.frp.toFixed(1) : '--'}</TableCell>
                    <TableCell className="text-muted-foreground">{timeSince(item.acquisitionDate)}</TableCell>
                    <TableCell className="mono text-xs">{item.latitude?.toFixed(4)}</TableCell>
                    <TableCell className="mono text-xs">{item.longitude?.toFixed(4)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
          Mostrando {filtered.length} de {eventosData.length} registros • Dados: NASA FIRMS Ao Vivo (Tempo Real)
        </div>
      </div>
    </div>
  );
}
