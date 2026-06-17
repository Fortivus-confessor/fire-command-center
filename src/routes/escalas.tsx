import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, CalendarDays, Filter, AlertTriangle, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api';

export const Route = createFileRoute('/escalas')({
  component: EscalasPage,
});

// ── Types ──────────────────────────────────────────────
const emptyForm = {
  centroComando: '',
  equipeId: '',
  dataInicio: '',
  dataFim: '',
  veiculoId: 'Nenhum',
  comandanteId: '',
  integranteIds: [] as string[],
};

// ── Helpers ────────────────────────────────────────────
function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

// Retorna as escalas ativas (apenas mock de lógica visual)
function getActiveVehicles(data: any[], ignoreEscalaId?: string) {
  const active = new Set<string>();
  data.forEach(e => {
    if (e.id !== ignoreEscalaId && e.veiculoId && e.veiculoId !== 'Nenhum') {
      active.add(e.veiculoId);
    }
  });
  return active;
}

// ── Page Component ─────────────────────────────────────
function EscalasPage() {
  const queryClient = useQueryClient();
  const { data: centrosDeComandoDB = [] } = useQuery<any[]>({
    queryKey: ['centros-comando'],
    queryFn: () => fetchWithAuth('/admin/centros'),
  });

  const { data: equipesDB = [] } = useQuery<any[]>({
    queryKey: ['equipes'],
    queryFn: () => fetchWithAuth('/admin/equipes'),
  });

  const { data: veiculosDB = [] } = useQuery<any[]>({
    queryKey: ['veiculos'],
    queryFn: () => fetchWithAuth('/ativos/frota'),
  });

  const { data: usuariosDB = [] } = useQuery<any[]>({
    queryKey: ['usuarios'],
    queryFn: () => fetchWithAuth('/admin/usuarios'),
  });

  const usuariosDisponiveis: string[] = usuariosDB.map((u: any) => u.nome).filter(Boolean);

  const { data: escalasData = [] } = useQuery<any[]>({
    queryKey: ['escalas'],
    queryFn: () => fetchWithAuth('/operacional/escalas')
  });

  const data = escalasData;

  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);

  const mutationSave = useMutation({
    mutationFn: (payload: any) => fetchWithAuth('/operacional/escalas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalas'] });
      setDialogOpen(false);
    },
    onError: () => {
      setErrorMsg('Erro ao salvar escala. Verifique os dados.');
    }
  });

  const mutationDelete = useMutation({
    mutationFn: (id: string) => fetchWithAuth(`/operacional/escalas/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalas'] });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [selectedLeft, setSelectedLeft] = useState<string[]>([]);
  const [selectedRight, setSelectedRight] = useState<string[]>([]);

  const [searchLeft, setSearchLeft] = useState('');
  const [searchRight, setSearchRight] = useState('');

  const activeVehicles = getActiveVehicles(data, editingItem?.id);

  const filtered = data.filter((item) => {
    const eq = equipesDB.find(e => e.id === item.equipeId);
    const centroNome = centrosDeComandoDB.find(c => c.id === eq?.centroComandoId)?.nome || '';
    const eqNome = eq?.nome || '';
    const cmdNome = usuariosDB.find(u => u.id === item.comandanteId)?.nome || '';

    const matchSearch =
      !search ||
      eqNome.toLowerCase().includes(search.toLowerCase()) ||
      centroNome.toLowerCase().includes(search.toLowerCase()) ||
      cmdNome.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  function openNew() {
    setEditingItem(null);
    setForm({ ...emptyForm });
    setErrorMsg('');
    setErrors({});
    setSelectedLeft([]);
    setSelectedRight([]);
    setSearchLeft('');
    setSearchRight('');
    setDialogOpen(true);
  }

  function openEdit(item: any) {
    setEditingItem(item);
    setErrorMsg('');
    setErrors({});
    const eq = equipesDB.find(e => e.id === item.equipeId);
    setForm({
      centroComando: eq?.centroComandoId || '',
      equipeId: item.equipeId || '',
      dataInicio: item.dataInicio ? item.dataInicio.substring(0, 10) : '',
      dataFim: item.dataFim ? item.dataFim.substring(0, 10) : '',
      veiculoId: item.veiculoId || 'Nenhum',
      comandanteId: item.comandanteId || '',
      integranteIds: item.integranteIds || [],
    });
    setSelectedLeft([]);
    setSelectedRight([]);
    setSearchLeft('');
    setSearchRight('');
    setDialogOpen(true);
  }

  function handleSave() {
    setErrorMsg('');
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!form.centroComando) newErrors.centroComando = "Selecione o centro de comando.";
    if (!form.equipeId) newErrors.equipeId = "Selecione a equipe.";
    if (!form.dataInicio) newErrors.dataInicio = "Informe a data de início.";
    if (!form.dataFim) newErrors.dataFim = "Informe a data de fim.";
    if (!form.veiculoId) newErrors.veiculoId = "Selecione um veículo.";
    if (!form.comandanteId) newErrors.comandanteId = "Selecione o comandante.";
    if (form.integranteIds.length === 0) newErrors.integranteIds = "A equipe deve ter ao menos um integrante.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setErrorMsg('Por favor, corrija os erros destacados abaixo.');
      return;
    }

    const payload = {
      id: editingItem?.id || undefined,
      equipeId: form.equipeId,
      veiculoId: form.veiculoId === 'Nenhum' ? null : form.veiculoId,
      comandanteId: form.comandanteId,
      dataInicio: form.dataInicio ? new Date(form.dataInicio).toISOString() : null,
      dataFim: form.dataFim ? new Date(form.dataFim).toISOString() : null,
      integranteIds: form.integranteIds,
      ativa: true
    };

    mutationSave.mutate(payload);
  }

  function confirmDelete(id: string) {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  }

  function handleDelete() {
    if (deletingId) {
      mutationDelete.mutate(deletingId);
    }
  }

  function toggleSelection(u: string, side: 'left' | 'right') {
    if (side === 'left') {
      setSelectedLeft(prev => prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]);
    } else {
      setSelectedRight(prev => prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]);
    }
  }

  function moveRight() {
    setForm(prev => ({ ...prev, integranteIds: [...prev.integranteIds, ...selectedLeft] }));
    setSelectedLeft([]);
  }

  function moveLeft() {
    setForm(prev => ({ ...prev, integranteIds: prev.integranteIds.filter(x => !selectedRight.includes(x)) }));
    setSelectedRight([]);
  }

  function moveAllRight() {
    const disponiveis = usuariosDB
      .filter((u: any) => String(u.centroComandoId) === String(form.centroComando))
      .map((u: any) => String(u.id))
      .filter((id: string) => !form.integranteIds.includes(id));
    setForm(prev => ({ ...prev, integranteIds: [...prev.integranteIds, ...disponiveis] }));
    setSelectedLeft([]);
  }

  function moveAllLeft() {
    setForm(prev => ({ ...prev, integranteIds: [] }));
    setSelectedRight([]);
  }

  const usuariosCentro = usuariosDB.filter((u: any) => String(u.centroComandoId) === String(form.centroComando));

  const disponiveis = usuariosCentro
    .filter((u: any) => !form.integranteIds.includes(String(u.id)))
    .filter((u: any) => u.nome?.toLowerCase().includes(searchLeft.toLowerCase()));

  const escalados = form.integranteIds
    .map(id => usuariosCentro.find(u => String(u.id) === String(id)))
    .filter(Boolean)
    .filter((u: any) => u.nome?.toLowerCase().includes(searchRight.toLowerCase()));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-warning" />
            Escalas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as escalas de serviço das equipes
          </p>
        </div>
        <Button onClick={openNew} className="bg-fire hover:bg-fire/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nova Escala
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por equipe, comando ou comandante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden glass border border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/40">
              <TableRow>
                <TableHead>Comando / Equipe</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Comandante</TableHead>
                <TableHead>Efetivo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma escala encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-secondary/20 transition">
                    <TableCell>
                      <div className="font-bold">{equipesDB.find(e => e.id === item.equipeId)?.nome || '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {centrosDeComandoDB.find(c => c.id === equipesDB.find(e => e.id === item.equipeId)?.centroComandoId)?.nome || '—'}
                      </div>
                    </TableCell>
                    <TableCell className="mono text-sm text-muted-foreground">
                      {formatDate(item.dataInicio)} — {formatDate(item.dataFim)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-command/30 font-mono">
                        {veiculosDB.find(v => v.id === item.veiculoId)?.identificador || 'Nenhum'}
                      </Badge>
                    </TableCell>
                    <TableCell>{usuariosDB.find(u => u.id === item.comandanteId)?.nome || '—'}</TableCell>
                    <TableCell className="mono">{item.integranteIds?.length || 0} usuário(s)</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8 hover:text-command">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(item.id)} className="h-8 w-8 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
          Mostrando {filtered.length} de {data.length} registros
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong sm:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>{editingItem ? 'Editar Escala' : 'Nova Escala'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Atualize os dados da escala.' : 'Preencha os dados para criar uma nova escala.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1 -mx-1 pr-4">
            {errorMsg && (
              <div className="bg-destructive/20 text-destructive text-sm px-3 py-2 rounded-md mb-4 border border-destructive/30">
                {errorMsg}
              </div>
            )}
            <div className="grid gap-5 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={errors.centroComando ? "text-destructive" : ""}>Centro de Comando</Label>
                  <Select value={form.centroComando ? String(form.centroComando) : undefined} onValueChange={(v) => setForm({ ...form, centroComando: v, equipeId: '' })}>
                    <SelectTrigger className={errors.centroComando ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecione o centro" />
                    </SelectTrigger>
                    <SelectContent>
                      {centrosDeComandoDB.map((cc: any) => (
                        <SelectItem key={cc.id} value={String(cc.id)}>{cc.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.centroComando && <p className="text-xs text-destructive">{errors.centroComando}</p>}
                </div>
                <div className="space-y-2">
                  <Label className={errors.equipeId ? "text-destructive" : ""}>Equipe</Label>
                  <Select disabled={!form.centroComando} value={form.equipeId ? String(form.equipeId) : undefined} onValueChange={(v) => setForm({ ...form, equipeId: v })}>
                    <SelectTrigger className={errors.equipeId ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecione a equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipesDB.filter((eq: any) => String(eq.centroComandoId) === String(form.centroComando)).map((eq: any) => (
                        <SelectItem key={eq.id} value={String(eq.id)}>{eq.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.equipeId && <p className="text-xs text-destructive">{errors.equipeId}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio" className={errors.dataInicio ? "text-destructive" : ""}>Data Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={form.dataInicio}
                    onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
                    className={errors.dataInicio ? "border-destructive" : ""}
                  />
                  {errors.dataInicio && <p className="text-xs text-destructive">{errors.dataInicio}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFim" className={errors.dataFim ? "text-destructive" : ""}>Data Fim</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={form.dataFim}
                    onChange={(e) => setForm({ ...form, dataFim: e.target.value })}
                    className={errors.dataFim ? "border-destructive" : ""}
                  />
                  {errors.dataFim && <p className="text-xs text-destructive">{errors.dataFim}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={errors.veiculoId ? "text-destructive" : ""}>Veículo Associado</Label>
                  <Select value={form.veiculoId ? String(form.veiculoId) : undefined} onValueChange={(v) => setForm({ ...form, veiculoId: v })}>
                    <SelectTrigger className={cn(
                      activeVehicles.has(form.veiculoId) ? 'border-warning text-warning' : '',
                      errors.veiculoId ? "border-destructive" : ""
                    )}>
                      <SelectValue placeholder="Selecione o veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nenhum">Nenhum</SelectItem>
                      {veiculosDB.map((v: any) => {
                        const isUsed = activeVehicles.has(String(v.id));
                        return (
                          <SelectItem key={v.id} value={String(v.id)}>
                            {v.modelo} - {v.identificador} {isUsed ? '(Em uso)' : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {errors.veiculoId && <p className="text-xs text-destructive">{errors.veiculoId}</p>}
                  {activeVehicles.has(form.veiculoId) && form.veiculoId !== 'Nenhum' && (
                    <p className="text-[10px] text-warning flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" />
                      Este veículo possui escala ativa no período.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className={errors.integranteIds ? "text-destructive" : ""}>Usuários Escalados</Label>
                <div className={cn("grid grid-cols-[1fr_auto_1fr] gap-4 h-48", errors.integranteIds ? "border border-destructive rounded-md p-1" : "")}>
                  <div className="border border-border rounded-md overflow-hidden bg-secondary/10 flex flex-col">
                    <div className="bg-secondary/40 px-3 py-1.5 text-xs font-semibold border-b border-border text-muted-foreground flex items-center justify-between">
                      <span>Disponíveis ({disponiveis.length})</span>
                    </div>
                    <div className="border-b border-border p-1 bg-background/50">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input 
                          placeholder="Buscar..." 
                          className="h-6 text-xs pl-6 py-0 border-0 bg-transparent ring-0 focus-visible:ring-0 px-2"
                          value={searchLeft}
                          onChange={(e) => setSearchLeft(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="p-1.5 flex-1 overflow-y-auto space-y-0.5">
                      {disponiveis.map((u: any) => (
                        <div 
                          key={u.id} 
                          className={cn("px-2 py-1.5 text-sm rounded cursor-pointer select-none transition-colors", selectedLeft.includes(String(u.id)) ? "bg-primary text-primary-foreground" : "hover:bg-secondary/30")}
                          onClick={() => toggleSelection(String(u.id), 'left')}
                          onDoubleClick={() => {
                            setForm(prev => ({ ...prev, integranteIds: [...prev.integranteIds, String(u.id)] }));
                            setSelectedLeft(prev => prev.filter(x => x !== String(u.id)));
                          }}
                        >
                          {u.nome}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-2">
                    <Button type="button" variant="outline" size="icon" onClick={moveAllRight} disabled={disponiveis.length === 0} className="h-8 w-8"><ChevronsRight className="h-4 w-4" /></Button>
                    <Button type="button" variant="outline" size="icon" onClick={moveRight} disabled={selectedLeft.length === 0} className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
                    <Button type="button" variant="outline" size="icon" onClick={moveLeft} disabled={selectedRight.length === 0} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
                    <Button type="button" variant="outline" size="icon" onClick={moveAllLeft} disabled={escalados.length === 0} className="h-8 w-8"><ChevronsLeft className="h-4 w-4" /></Button>
                  </div>

                  <div className="border border-border rounded-md overflow-hidden bg-secondary/10 flex flex-col">
                    <div className="bg-secondary/40 px-3 py-1.5 text-xs font-semibold border-b border-border text-muted-foreground flex items-center justify-between">
                      <span>Escalados ({escalados.length})</span>
                    </div>
                    <div className="border-b border-border p-1 bg-background/50">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input 
                          placeholder="Buscar..." 
                          className="h-6 text-xs pl-6 py-0 border-0 bg-transparent ring-0 focus-visible:ring-0 px-2"
                          value={searchRight}
                          onChange={(e) => setSearchRight(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="p-1.5 flex-1 overflow-y-auto space-y-0.5">
                      {escalados.map((u: any) => (
                        <div 
                          key={u.id} 
                          className={cn("px-2 py-1.5 text-sm rounded cursor-pointer select-none transition-colors", selectedRight.includes(String(u.id)) ? "bg-primary text-primary-foreground" : "hover:bg-secondary/30")}
                          onClick={() => toggleSelection(String(u.id), 'right')}
                          onDoubleClick={() => {
                            setForm(prev => ({ ...prev, integranteIds: prev.integranteIds.filter(x => x !== String(u.id)) }));
                            setSelectedRight(prev => prev.filter(x => x !== String(u.id)));
                          }}
                        >
                          {u.nome}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-right mt-1">Dica: Clique duplo para mover rapidamente</p>
                {errors.integranteIds && <p className="text-xs text-destructive">{errors.integranteIds}</p>}
              </div>

              <div className="space-y-2">
                <Label className={errors.comandanteId ? "text-destructive" : ""}>Comandante da Escala</Label>
                <Select disabled={form.integranteIds.length === 0} value={form.comandanteId ? String(form.comandanteId) : undefined} onValueChange={(v) => setForm({ ...form, comandanteId: v })}>
                  <SelectTrigger className={errors.comandanteId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione o comandante" />
                  </SelectTrigger>
                  <SelectContent>
                    {escalados.map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.comandanteId && <p className="text-xs text-destructive">{errors.comandanteId}</p>}
                {form.integranteIds.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1 text-warning">
                    Adicione usuários na lista acima para definir o comandante.
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-fire hover:bg-fire/90 text-white">
              {editingItem ? 'Salvar Alterações' : 'Criar Escala'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-strong">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta escala? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

