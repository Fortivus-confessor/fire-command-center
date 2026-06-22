import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Search, Flame, AlertTriangle, MapPin, Eye, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export const Route = createFileRoute('/eventos-fogo')({
  component: EventosFogoPage,
});

// Tipagem com base no EventoFogoDTO do backend
interface EventoFogo {
  id: string;
  codigoVisual: string;
  latitude: number;
  longitude: number;
  status: string;
  frpTotal: number;
  totalFocos: number;
  primeiraDeteccao: string;
  ultimaDeteccao: string;
}

interface PageResponse {
  content: EventoFogo[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  last: boolean;
  first: boolean;
}

// Helpers
function riscoBadge(status: string) {
  const norm = (status || '').toUpperCase();
  switch (norm) {
    case 'ATIVO_SEVERO': return <Badge className="bg-fire/20 text-fire border-fire/30 uppercase text-[10px]">Extremo</Badge>;
    case 'MONITORAMENTO': return <Badge className="bg-warning/20 text-warning border-warning/30 uppercase text-[10px]">Médio</Badge>;
    case 'EXTINTO': return <Badge className="bg-success/20 text-success border-success/30 uppercase text-[10px]">Extinto</Badge>;
    default: return <Badge variant="secondary">{norm}</Badge>;
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

function EventosFogoPage() {
  const [pageIndex, setPageIndex] = useState(0);
  const [listAll, setListAll] = useState(false);
  const pageSize = listAll ? 1000 : 10;
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<EventoFogo | null>(null);

  const { data: pageData, isLoading } = useQuery<PageResponse>({
    queryKey: ['eventosFogoPaged', pageIndex, pageSize],
    queryFn: () => fetch(`/api/v1/fire-events?page=${pageIndex}&size=${pageSize}`).then(res => res.json())
  });

  const eventosData = pageData?.content || [];
  
  const filtered = eventosData.filter((item) => {
    const matchSearch =
      !search ||
      (item.codigoVisual && item.codigoVisual.toLowerCase().includes(search.toLowerCase())) ||
      (item.id && item.id.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  // KPIs
  const totalFocos = pageData?.totalElements || 0;
  const riscoExtremo = eventosData.filter((e) => e.status === 'ATIVO_SEVERO').length;

  const kpis = [
    { label: 'Total de Eventos', value: totalFocos, icon: Flame, color: 'text-fire' },
    { label: 'Risco Extremo (Listados)', value: riscoExtremo, icon: AlertTriangle, color: 'text-destructive' },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/30">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-fire/10 rounded-lg">
              <Flame className="h-6 w-6 text-fire" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Eventos de Fogo
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Acompanhamento e despacho operacional de eventos severos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-background ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID ou Código Visual..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full bg-background"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant={listAll ? "default" : "outline"} 
                onClick={() => {
                  setListAll(!listAll);
                  setPageIndex(0);
                }}
              >
                {listAll ? "Paginar Resultados" : "Listar Todos"}
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[150px]">ID</TableHead>
                    <TableHead>FRP Total</TableHead>
                    <TableHead>Qtd Focos</TableHead>
                    <TableHead>Última Detecção</TableHead>
                    <TableHead>Risco</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        Carregando eventos...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        Nenhum evento encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="font-mono text-sm font-semibold">{item.codigoVisual || item.id}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{item.frpTotal ? item.frpTotal.toFixed(1) : '--'} MW</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{item.totalFocos} focos</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{timeSince(item.ultimaDeteccao)} atrás</span>
                          </div>
                        </TableCell>
                        <TableCell>{riscoBadge(item.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(item)}>
                              <Eye className="h-4 w-4 mr-1" /> Visualizar
                            </Button>
                            <Link to={`/ordens-servico/nova`} search={{ eventoFogoId: item.id }}>
                              <Button variant="outline" size="sm" className="border-command text-command hover:bg-command hover:text-white">
                                <ExternalLink className="h-4 w-4 mr-1" /> Despachar OS
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {!listAll && pageData && pageData.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  PÃ¡gina {pageData.number + 1} de {pageData.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPageIndex(p => Math.max(0, p - 1))}
                    disabled={pageData.first}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPageIndex(p => p + 1)}
                    disabled={pageData.last}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Visualizar Evento */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-fire" />
              Detalhes do Evento {selectedEvent?.codigoVisual}
            </DialogTitle>
            <DialogDescription>
              Informações completas do evento de fogo selecionado.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">ID do Banco</Label>
                  <div className="font-mono text-sm">{selectedEvent.id}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Código Visual</Label>
                  <div className="font-mono text-sm font-bold text-primary">{selectedEvent.codigoVisual}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status do Risco</Label>
                  <div>{riscoBadge(selectedEvent.status)}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Localização</Label>
                  <div className="text-sm font-mono flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedEvent.latitude?.toFixed(4)}, {selectedEvent.longitude?.toFixed(4)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">FRP Total</Label>
                  <div className="text-sm font-semibold">{selectedEvent.frpTotal?.toFixed(2)} MW</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Quantidade de Focos Agrupados</Label>
                  <div className="text-sm">{selectedEvent.totalFocos} focos</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Primeira Detecção</Label>
                  <div className="text-sm">{new Date(selectedEvent.primeiraDeteccao).toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Última Detecção (Ação do Satélite)</Label>
                  <div className="text-sm">{new Date(selectedEvent.ultimaDeteccao).toLocaleString()}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedEvent(null)}>Fechar</Button>
                <Link to={`/ordens-servico/nova`} search={{ eventoFogoId: selectedEvent.id }} onClick={() => setSelectedEvent(null)}>
                  <Button className="bg-command text-white hover:bg-command/90">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Despachar OS
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

