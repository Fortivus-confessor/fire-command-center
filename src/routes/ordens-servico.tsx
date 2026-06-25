import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, FileText, Filter, MapPin, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api';
import { SituationMap } from '../components/fortivus/map/SituationMap';
import { useCanAccess } from '@/hooks/useCanAccess';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const Route = createFileRoute('/ordens-servico')({
  component: OrdensServicoPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      highlightId: search.highlightId as string | undefined,
    }
  }
});

// ── Types ──────────────────────────────────────────────
interface OrdemServico {
  id: string;
  codigo: string;
  comando: string;
  equipe: string;
  tipoDespacho: string;
  prioridade: string;
  status: string;
  responsavel: string;
  descricao: string;
  latLng: string;
  criadaHa: string;
  dataFim: string;
  eventoFogoId: string;
}

const initialData: OrdemServico[] = [];

const emptyForm = {
  codigo: '',
  comando: '',
  equipe: '',
  tipoDespacho: '',
  prioridade: 'P2',
  status: 'ABERTA',
  responsavel: '',
  descricao: '',
  latLng: '',
  criadaHa: '',
  dataFim: '',
  eventoFogoId: '',
};

// ── Helpers ────────────────────────────────────────────
function formatDateBR(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatTipoDespacho(tipo: string) {
  switch (tipo) {
    case 'TERRESTRE': return 'Terrestre';
    case 'AEREO': return 'Aéreo';
    case 'MAQUINARIO': return 'Maquinário';
    case 'AQUATICO': return 'Aquático';
    default: return tipo || 'N/A';
  }
}

function formatStatus(status: string) {
  switch (status) {
    case 'ABERTA': return 'Aberta';
    case 'EM_EXECUCAO': return 'Em Execução';
    case 'CONCLUIDA': return 'Concluída';
    case 'CANCELADA': return 'Cancelada';
    default: return status || 'N/A';
  }
}

function prioridadeBadge(p: string) {
  switch (p) {
    case 'P1': return <Badge className="bg-fire/20 text-fire border-fire/30">P1</Badge>;
    case 'P2': return <Badge className="bg-warning/20 text-warning border-warning/30">P2</Badge>;
    case 'P3': return <Badge className="bg-command/20 text-command border-command/30">P3</Badge>;
    default: return <Badge variant="secondary">{p}</Badge>;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'ABERTA': return 'bg-blue-500/10 text-blue-500';
    case 'EM_EXECUCAO': return 'bg-amber-500/10 text-amber-500';
    case 'CONCLUIDA': return 'bg-emerald-500/10 text-emerald-500';
    case 'CANCELADA': return 'bg-red-500/10 text-red-500';
    default: return 'bg-secondary text-secondary-foreground';
  }
}

function statusBadge(s: string) {
  const display = formatStatus(s);
  switch (s) {
    case 'ABERTA': return <Badge variant="secondary">{display}</Badge>;
    case 'EM_EXECUCAO': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">{display}</Badge>;
    case 'CONCLUIDA': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">{display}</Badge>;
    case 'CANCELADA': return <Badge className="bg-red-500/10 text-red-500 border-red-500/30">{display}</Badge>;
    default: return <Badge variant="secondary">{display}</Badge>;
  }
}

function tipoBadge(t: string) {
  const display = formatTipoDespacho(t);
  if (t === 'TERRESTRE') return <Badge className="bg-success/20 text-success border-success/30">{display}</Badge>;
  if (t === 'AEREO') return <Badge className="bg-command/20 text-command border-command/30">{display}</Badge>;
  if (t === 'MAQUINARIO') return <Badge className="bg-warning/20 text-warning border-warning/30">{display}</Badge>;
  return <Badge variant="secondary">{display}</Badge>;
}

// ── Page Component ─────────────────────────────────────
function OrdensServicoPage() {
  const [pageIndex, setPageIndex] = useState(0);
  const [listAll, setListAll] = useState(false);
  const pageSize = listAll ? 1000 : 10;
  const highlightId = Route.useSearch({ select: (s) => s.highlightId });
  const navigate = useNavigate();
  const canManage = useCanAccess('ordens-servico', 'edit');
  const canCreate = useCanAccess('ordens-servico', 'create');

  const { data: pageData, isLoading: loadingOrdens } = useQuery<any>({
    queryKey: ['ordens-servico', pageIndex, pageSize],
    queryFn: () => fetchWithAuth(`/operacional/os/paged?page=${pageIndex}&size=${pageSize}`)
  });

  const data = pageData?.content || [];
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPrioridade, setFilterPrioridade] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: centrosDeComandoDB = [] } = useQuery<any[]>({
    queryKey: ['centros-comando'],
    queryFn: () => fetchWithAuth('/admin/centros'),
  });

  const { data: usuariosDB = [] } = useQuery<any[]>({
    queryKey: ['usuarios'],
    queryFn: () => fetchWithAuth('/admin/usuarios'),
  });

  const { data: escalasAtivas = [] } = useQuery<any[]>({
    queryKey: ['escalas-ativas', form.comando],
    queryFn: () => fetchWithAuth(`/operacional/escalas/centro/${form.comando}/ativas`),
    enabled: !!form.comando,
  });

  const { data: todasEscalas = [] } = useQuery<any[]>({
    queryKey: ['escalas'],
    queryFn: () => fetchWithAuth('/operacional/escalas')
  });

  const { data: todasEquipes = [] } = useQuery<any[]>({
    queryKey: ['equipes'],
    queryFn: () => fetchWithAuth('/admin/equipes')
  });

  const { data: ordensServicoDB = [], refetch } = useQuery<any[]>({
    queryKey: ['ordens-servico'],
    queryFn: () => fetchWithAuth('/operacional/os'),
  });

  const { data: despachosDB = [] } = useQuery<any[]>({
    queryKey: ['despachos'],
    queryFn: () => fetchWithAuth('/operacional/despachos'),
  });

  const [citySearch, setCitySearch] = useState('');
  const [isDms, setIsDms] = useState(false);
  const [flyTo, setFlyTo] = useState<{lat: number, lng: number} | null>(null);

  function ddToDms(dd: number, isLng: boolean) {
    const dir = dd < 0 ? (isLng ? 'W' : 'S') : (isLng ? 'E' : 'N');
    const absDd = Math.abs(dd);
    const deg = Math.floor(absDd);
    const min = Math.floor((absDd - deg) * 60);
    const sec = ((absDd - deg - min / 60) * 3600).toFixed(1);
    return `${deg}° ${min}' ${sec}" ${dir}`;
  }

  function getDisplayLatLng(latLngStr: string) {
    if (!latLngStr) return '';
    if (!isDms) return latLngStr;
    const [lat, lng] = latLngStr.split(',').map(n => parseFloat(n.trim()));
    if (isNaN(lat) || isNaN(lng)) return latLngStr;
    return `${ddToDms(lat, false)}, ${ddToDms(lng, true)}`;
  }

  const [cityResults, setCityResults] = useState<any[]>([]);

  const [eventoFogoSearch, setEventoFogoSearch] = useState('');
  const [eventoFogoResults, setEventoFogoResults] = useState<any[]>([]);
  const [isSearchingEvento, setIsSearchingEvento] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (eventoFogoSearch.length > 2) {
        setIsSearchingEvento(true);
        fetchWithAuth(`/fire-events/buscar?q=${encodeURIComponent(eventoFogoSearch)}`)
          .then(data => setEventoFogoResults(data || []))
          .catch(console.error)
          .finally(() => setIsSearchingEvento(false));
      } else {
        setEventoFogoResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [eventoFogoSearch]);

  // Live search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (citySearch.length > 2) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&q=${encodeURIComponent(citySearch)}`)
          .then(res => res.json())
          .then(data => setCityResults(data || []))
          .catch(console.error);
      } else {
        setCityResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [citySearch]);

  function handleLatLngInputChange(val: string) {
    setForm(prev => ({ ...prev, latLng: val }));
    const parts = val.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        setFlyTo({ lat, lng });
      }
    }
  }

  // ── Filtered data ──

  const mappedData = ordensServicoDB.map((dbOs: any) => {
    const escala = todasEscalas.find((e: any) => e.id === dbOs.escalaId);
    const equipe = todasEquipes.find((e: any) => e.id === escala?.equipeId);
    const equipeName = equipe?.nome || 'Equipe Desconhecida';
    const centroId = escala?.centroComandoId || dbOs.comandoId || equipe?.centroComandoId;
    const centro = centrosDeComandoDB.find((c: any) => c.id === centroId);
    const comandoName = centro?.nome || 'Centro Desconhecido';
    
    const resp = usuariosDB.find((u: any) => String(u.id) === String(dbOs.relatorId));
    const responsavelName = resp?.nome || dbOs.relatorId || 'Desconhecido';

    return {
      id: dbOs.id,
      codigo: dbOs.smartId || `OS${dbOs.id}`,
      comando: comandoName,
      equipe: equipeName,
      tipoDespacho: dbOs.tipoDespacho || '',
      prioridade: dbOs.prioridade || 'P2',
      status: dbOs.status || 'ABERTA',
      responsavel: responsavelName,
      descricao: dbOs.descricaoTarefa || '',
      eventoFogoId: dbOs.eventoFogoId || '',
      latLng: (dbOs.latitude && dbOs.longitude) ? `${dbOs.latitude}, ${dbOs.longitude}` : '',
      criadaHa: dbOs.dataCriacao ? formatDateBR(dbOs.dataCriacao) : '',
      dataFim: dbOs.dataFim ? formatDateBR(dbOs.dataFim) : ''
    };
  });

  const filtered = mappedData.filter((item: any) => {
    const matchSearch =
      !search ||
      item.codigo.toLowerCase().includes(search.toLowerCase()) ||
      item.equipe.toLowerCase().includes(search.toLowerCase()) ||
      item.comando.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchPrioridade = filterPrioridade === 'all' || item.prioridade === filterPrioridade;
    return matchSearch && matchStatus && matchPrioridade;
  });

  // ── Handlers ──
  function openNew() {
    setEditingItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(item: any) {
    setEditingItem(item);
    setEventoFogoSearch(item.eventoFogoCodigo ? formatCodigoEvento(item.eventoFogoCodigo) : (item.eventoFogoId || ''));
    setForm({
      codigo: item.codigo,
      comando: item.comando,
      equipe: item.equipe,
      tipoDespacho: item.tipoDespacho,
      prioridade: item.prioridade,
      status: item.status,
      responsavel: item.responsavel,
      descricao: item.descricao,
      eventoFogoId: item.eventoFogoId,
      latLng: item.latLng,
      criadaHa: item.criadaHa,
      dataFim: item.dataFim,
    });
    setDialogOpen(true);
  }

  // ── Handling Search Params (Highlight)
  useEffect(() => {
    if (highlightId && ordensServicoDB.length > 0) {
      const dbOs = ordensServicoDB.find((os: any) => os.id === Number(highlightId));
      if (dbOs) {
        const item = {
          id: dbOs.id,
          codigo: dbOs.smartId || `OS${dbOs.id}`,
          comando: dbOs.comandoId ? String(dbOs.comandoId) : '',
          equipe: dbOs.escalaId ? String(dbOs.escalaId) : '',
          tipoDespacho: dbOs.tipoDespacho || '',
          prioridade: 'P2',
          status: dbOs.status || 'ABERTA',
          responsavel: dbOs.relatorId ? String(dbOs.relatorId) : '',
          descricao: dbOs.descricaoTarefa || '',
          eventoFogoId: dbOs.eventoFogoId || '',
          latLng: (dbOs.latitude && dbOs.longitude) ? `${dbOs.latitude}, ${dbOs.longitude}` : '',
          criadaHa: dbOs.dataCriacao ? formatDateBR(dbOs.dataCriacao) : '',
          dataFim: dbOs.dataFim ? formatDateBR(dbOs.dataFim) : ''
        };
        openEdit(item);
      }
    }
  }, [highlightId, ordensServicoDB]);

  async function save() {
    try {
      const latLngStr = form.latLng;
      let lat = NaN;
      let lng = NaN;
      
      if (latLngStr.includes('°')) {
        const parse = (dms: string) => {
          const parts = dms.match(/(\d+)\s*°\s*(\d+)\s*'\s*([\d.]+)\s*"\s*([NSWE])/i);
          if (!parts) return NaN;
          let dd = parseFloat(parts[1]) + parseFloat(parts[2]) / 60 + parseFloat(parts[3]) / 3600;
          if (parts[4].toUpperCase() === 'S' || parts[4].toUpperCase() === 'W') dd = -dd;
          return dd;
        };
        lat = parse(latLngStr.split(',')[0] || '');
        lng = parse(latLngStr.split(',')[1] || '');
      } else {
        lat = parseFloat(latLngStr.split(',')[0]);
        lng = parseFloat(latLngStr.split(',')[1]);
      }

      const payload = {
        descricaoTarefa: form.descricao,
        eventoFogoId: form.eventoFogoId || null,
        status: form.status,
        prioridade: form.prioridade,
        escalaId: form.equipe,
        responsavelId: form.responsavel,
        tipoDespacho: form.tipoDespacho,
        latitude: isNaN(lat) ? null : lat,
        longitude: isNaN(lng) ? null : lng,
      };

      if (editingItem) {
        await fetchWithAuth(`/operacional/os/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchWithAuth('/operacional/os', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      refetch();
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingItem(null);
    } catch (e) {
      console.error(e);
    }
  }

  const [deleteWarning, setDeleteWarning] = useState<any[]>([]);

  const formatCodigoEvento = (codigo: string) => {
    if (!codigo) return '';
    const clean = codigo.replace(/\D/g, '');
    if (clean.length === 12) {
      return `${clean.substring(0,4)}-${clean.substring(4)}`;
    }
    return codigo;
  };

  function confirmDelete(id: string) {
    const despachosDaOs = despachosDB.filter((d: any) => String(d.ordemServicoId) === String(id));
    setDeletingId(id);
    setDeleteWarning(despachosDaOs);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (deletingId && deleteWarning.length === 0) {
      try {
        await fetchWithAuth(`/operacional/os/${deletingId}`, { method: 'DELETE' });
        refetch();
      } catch (e) {
        console.error(e);
      }
    }
    setDeleteDialogOpen(false);
    setDeletingId(null);
  }

  function handleCaptureLocation() {
    // Mocking location capture
    setForm({ ...form, latLng: '-12.000, -50.000' });
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-fire" />
            Ordens de Serviço
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie Ordens de Serviço
          </p>
        </div>
        {canCreate && (
        <Button onClick={() => navigate({ to: '/ordens-servico/nova', search: { eventoFogoId: undefined } })} className="bg-fire hover:bg-fire/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar OS
        </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, equipe ou comando..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="Rascunho">Rascunho</SelectItem>
              <SelectItem value="Aprovada">Aprovada</SelectItem>
              <SelectItem value="Em andamento">Em andamento</SelectItem>
              <SelectItem value="Concluída">Concluída</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="P1">P1 – Crítica</SelectItem>
              <SelectItem value="P2">P2 – Alta</SelectItem>
              <SelectItem value="P3">P3 – Normal</SelectItem>
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
                <TableHead>ID</TableHead>
                <TableHead>Comando / Equipe</TableHead>
                <TableHead>Tipo Despacho</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de criação</TableHead>
                <TableHead>Data final</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma ordem de serviço encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-secondary/20 transition">
                    <TableCell className="mono font-medium">{item.codigo}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.equipe}</div>
                      <div className="text-xs text-muted-foreground">{item.comando}</div>
                    </TableCell>
                    <TableCell>{tipoBadge(item.tipoDespacho)}</TableCell>
                    <TableCell>{item.responsavel}</TableCell>
                    <TableCell>{prioridadeBadge(item.prioridade)}</TableCell>
                    <TableCell>{statusBadge(item.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{item.criadaHa}</TableCell>
                    <TableCell className="text-muted-foreground">{item.dataFim}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate({ to: `/ordens-servico/${item.id}` as any })} className="h-8 w-8 hover:text-primary">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8 hover:text-command">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canManage && (
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(item.id)} className="h-8 w-8 hover:text-destructive">
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
        
          {!listAll && pageData && pageData.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Página {pageData.number + 1} de {pageData.totalPages} (Mostrando {filtered.length} de {pageData.totalElements})
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar / Editar OS</DialogTitle>
            <DialogDescription>
              Atualize as descrições ou vincule a um Evento de Fogo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingItem && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">ID da OS</Label>
                  <Input id="codigo" value={form.codigo} readOnly className="mono bg-secondary/30 text-muted-foreground" />
                </div>
                <div className="space-y-2 relative">
                  <Label>ID do Evento de Fogo</Label>
                  <Input 
                    placeholder="Buscar código (ex: EV-)..." 
                    value={eventoFogoSearch}
                    onChange={(e) => {
                       setEventoFogoSearch(e.target.value);
                       if(e.target.value === '') setForm({...form, eventoFogoId: ''});
                    }}
                    onFocus={() => {
                       if (form.eventoFogoId && !eventoFogoSearch) setEventoFogoSearch(form.eventoFogoId);
                    }}
                  />
                  {eventoFogoResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-[100] bg-background border border-border mt-1 max-h-48 overflow-y-auto rounded-md shadow-lg">
                      {eventoFogoResults.map((res: any) => (
                        <div
                          key={res.id}
                          className="px-3 py-2 hover:bg-secondary/50 cursor-pointer text-sm flex justify-between"
                          onClick={() => {
                            setForm({ ...form, eventoFogoId: res.id });
                            setEventoFogoSearch(res.codigo ? formatCodigoEvento(res.codigo) : res.id);
                            setEventoFogoResults([]);
                          }}
                        >
                          <span className="font-medium truncate max-w-[200px]" title={res.id}>{res.codigo ? formatCodigoEvento(res.codigo) : res.id}</span>
                          <span className="text-muted-foreground text-xs">{res.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {form.eventoFogoId && (
                     <div className="text-xs text-muted-foreground mt-1 break-all">
                       Vinculado: {form.eventoFogoId} (ID)
                       <span className="text-destructive ml-2 cursor-pointer font-medium hover:underline" onClick={() => { setForm({...form, eventoFogoId: ''}); setEventoFogoSearch(''); }}>Desvincular</span>
                     </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Descrição da OS</Label>
              <Textarea 
                placeholder="Descreva as orientações e diretrizes da OS..." 
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} type="button">Cancelar</Button>
            <Button onClick={save} className="bg-fire hover:bg-fire/90 text-white" type="button">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-strong max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteWarning.length > 0 ? "Aviso: OS possui despachos" : "Confirmar Exclusão"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteWarning.length > 0 ? (
                <div className="space-y-2 mt-2">
                  <p className="text-warning font-medium">Esta OS possui {deleteWarning.length} despacho(s) atrelado(s) e não pode ser excluída.</p>
                  <ul className="list-disc pl-4 text-sm text-muted-foreground max-h-32 overflow-y-auto">
                    {deleteWarning.map((d: any) => (
                      <li key={d.id}>Despacho #{d.id} - {d.status}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                "Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {deleteWarning.length === 0 && (
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
