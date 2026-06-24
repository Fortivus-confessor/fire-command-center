import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { Search, Trash2, Truck, Filter, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCanAccess } from '@/hooks/useCanAccess';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/despachos')({
  component: DespachosPage,
});

// Helpers
function statusBadge(s: string) {
  if (!s) return null;
  switch (s) {
    case 'EM_ANDAMENTO': return <Badge className="bg-warning/20 text-warning border-warning/30">Em Andamento</Badge>;
    case 'CONCLUIDA': return <Badge className="bg-success/20 text-success border-success/30">Concluída</Badge>;
    case 'CANCELADA': return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Cancelada</Badge>;
    default: return <Badge variant="secondary">{s.replace('_', ' ')}</Badge>;
  }
}

function formatId(id: number | string | undefined) {
  if (!id) return '--';
  return `D${String(id).padStart(12, '0')}`;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '--';
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

function DespachosPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canRespond = useCanAccess('despachos', 'edit');
  const canDelete = useCanAccess('despachos', 'delete');

  const [pageIndex, setPageIndex] = useState(0);
  const [listAll, setListAll] = useState(false);
  const pageSize = listAll ? 1000 : 10;

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dataInicioFilter, setDataInicioFilter] = useState('');
  const [dataFimFilter, setDataFimFilter] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: despachos = [], isLoading } = useQuery<any[]>({
    queryKey: ['despachos'],
    queryFn: () => fetchWithAuth('/operacional/despachos'),
  });

  const { data: escalas = [] } = useQuery<any[]>({
    queryKey: ['escalas'],
    queryFn: () => fetchWithAuth('/operacional/escalas'),
  });

  const { data: equipes = [] } = useQuery<any[]>({
    queryKey: ['equipes'],
    queryFn: () => fetchWithAuth('/admin/equipes'),
  });

  const { data: usuarios = [] } = useQuery<any[]>({
    queryKey: ['usuarios'],
    queryFn: () => fetchWithAuth('/admin/usuarios'),
  });

  const mutationDelete = useMutation({
    mutationFn: (id: number) => fetchWithAuth(`/operacional/despachos/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despachos'] });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
  });

  // Cross-reference data
  const enrichedDespachos = useMemo(() => {
    return despachos.map(d => {
      const escala = escalas.find(e => e.id === d.escalaId);
      const equipe = escala ? equipes.find(eq => eq.id === escala.equipeId) : null;
      const comandante = escala ? usuarios.find(u => u.id === escala.comandanteId) : null;
      
      const equipeNome = equipe ? equipe.nome : 'Equipe Desconhecida';
      const cmdNome = comandante ? comandante.nome : 'Comandante Desconhecido';

      return {
        ...d,
        equipeStr: `${equipeNome} - ${cmdNome}`,
      };
    }).sort((a, b) => b.id - a.id);
  }, [despachos, escalas, equipes, usuarios]);

  // Filters
  const filtered = enrichedDespachos.filter((item) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      !search ||
      formatId(item.id).toLowerCase().includes(searchLower) ||
      String(item.ordemServicoId || '').includes(searchLower) ||
      item.equipeStr.toLowerCase().includes(searchLower) ||
      (item.descricaoTarefa || '').toLowerCase().includes(searchLower);
      
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;

    let matchDates = true;
    if (dataInicioFilter || dataFimFilter) {
      const start = new Date(item.dataInicio).getTime();
      const end = item.dataFim ? new Date(item.dataFim).getTime() : Date.now(); // active until now if no end date
      
      const filterStart = dataInicioFilter ? new Date(dataInicioFilter).getTime() : 0;
      const filterEnd = dataFimFilter ? new Date(dataFimFilter).getTime() : Infinity;

      // Check if dispatch was active during the filter period
      matchDates = (start <= filterEnd) && (end >= filterStart);
    }

    return matchSearch && matchStatus && matchDates;
  });

  // Pagination
  const totalElements = filtered.length;
  const totalPages = Math.ceil(totalElements / pageSize) || 1;
  const startIndex = pageIndex * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = filtered.slice(startIndex, endIndex);

  function openRespond(item: any) {
    const cat = item.categoria || 'TERRESTRE';
    if (cat === 'TERRESTRE') navigate({ to: `/responder-terrestre/${item.id}` as any });
    else if (cat === 'AEREO') navigate({ to: `/responder-aereo/${item.id}` as any });
    else if (cat === 'MAQUINARIO') navigate({ to: `/responder-maquinario/${item.id}` as any });
  }

  function confirmDelete(id: number) {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  }

  function handleDelete() {
    if (deletingId) mutationDelete.mutate(deletingId);
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/30">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-command/10 rounded-lg">
              <Truck className="h-6 w-6 text-command" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Despachos
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Acompanhe e responda os despachos das equipes
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Filters */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, OS ou Equipe..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPageIndex(0); }}
                className="pl-9 bg-background"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Período:</span>
                <Input type="date" value={dataInicioFilter} onChange={e => { setDataInicioFilter(e.target.value); setPageIndex(0); }} className="w-auto h-9 bg-background" title="Data Início" />
                <span className="text-muted-foreground">-</span>
                <Input type="date" value={dataFimFilter} onChange={e => { setDataFimFilter(e.target.value); setPageIndex(0); }} className="w-auto h-9 bg-background" title="Data Fim" />
              </div>
              <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPageIndex(0); }}>
                <SelectTrigger className="w-[160px] bg-background">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
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
                    <TableHead>ID Despacho</TableHead>
                    <TableHead>ID OS</TableHead>
                    <TableHead>Equipe - Comandante</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Data Resposta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando despachos...</TableCell>
                    </TableRow>
                  ) : currentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum despacho encontrado.</TableCell>
                    </TableRow>
                  ) : (
                    currentData.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono text-sm">{formatId(item.id)}</TableCell>
                        <TableCell className="font-mono text-sm">OS{item.ordemServicoId}</TableCell>
                        <TableCell className="font-medium text-foreground">{item.equipeStr}</TableCell>
                        <TableCell>{item.categoria || '--'}</TableCell>
                        <TableCell>{formatDate(item.dataInicio)}</TableCell>
                        <TableCell className={!item.dataFim ? "text-muted-foreground/50" : ""}>{formatDate(item.dataFim)}</TableCell>
                        <TableCell>{statusBadge(item.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canRespond && item.status === 'EM_ANDAMENTO' && (
                              <Button variant="outline" size="sm" onClick={() => openRespond(item)} className="h-8 border-command/30 text-command hover:bg-command hover:text-white">
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Responder
                              </Button>
                            )}
                            {canRespond && item.status !== 'EM_ANDAMENTO' && (
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => window.open(`/relatorio-pdf/${item.id}`, '_blank')} className="h-8 border-blue-500/30 text-blue-600 hover:bg-blue-500 hover:text-white">
                                  Visualizar (PDF)
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => openRespond(item)} className="h-8 border-orange-500/30 text-orange-600 hover:bg-orange-500 hover:text-white">
                                  Editar Resposta
                                </Button>
                              </div>
                            )}
                            {canDelete && (
                              <Button variant="ghost" size="icon" onClick={() => confirmDelete(item.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {!listAll && totalElements > 0 && (
              <div className="border-t border-border bg-card/50 px-4 py-3 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, totalElements)} de {totalElements}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPageIndex(p => Math.max(0, p - 1))} disabled={pageIndex === 0}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-2">
                    Página {pageIndex + 1} de {totalPages}
                  </span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPageIndex(p => Math.min(totalPages - 1, p + 1))} disabled={pageIndex >= totalPages - 1}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Despacho</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este despacho? Esta ação não pode ser desfeita e pode impactar o histórico da operação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {mutationDelete.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
