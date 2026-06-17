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
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api';

export const Route = createFileRoute('/escalas')({
  component: EscalasPage,
});

// ── Types ──────────────────────────────────────────────
interface Escala {
  id: string;
  centroComando: string;
  equipe: string;
  dataInicio: string;
  dataFim: string;
  veiculo: string;
  comandante: string;
  usuariosEscalados: string[];
}

// ── Mock Data ──────────────────────────────────────────
const usuariosDisponiveis = [
  'Cap. Silva', 'Maj. Santos', 'Sgt. Pereira', 'Sgt. Dias',
  'Ten. Costa', 'Cb. Mendes', 'Ten. Oliveira', 'Cb. Lima',
  'Cap. Ferreira', 'Sd. Rocha', 'Cel. Souza'
];

const initialData: Escala[] = [
  { id: '1', centroComando: 'Base Norte', equipe: 'Alfa-1', dataInicio: '2025-06-12', dataFim: '2025-06-13', veiculo: 'VTR-01', comandante: 'Cap. Silva', usuariosEscalados: ['Cap. Silva', 'Sgt. Pereira'] },
  { id: '2', centroComando: 'Base Sul', equipe: 'Bravo-2', dataInicio: '2025-06-12', dataFim: '2025-06-12', veiculo: 'VTR-02', comandante: 'Maj. Santos', usuariosEscalados: ['Maj. Santos', 'Ten. Costa'] },
];

const emptyForm: Omit<Escala, 'id'> = {
  centroComando: '',
  equipe: '',
  dataInicio: '',
  dataFim: '',
  veiculo: 'Nenhum',
  comandante: '',
  usuariosEscalados: [],
};

// ── Helpers ────────────────────────────────────────────
function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// Retorna as escalas ativas (apenas mock de lógica visual)
function getActiveVehicles(data: Escala[], ignoreEscalaId?: string) {
  const active = new Set<string>();
  data.forEach(e => {
    if (e.id !== ignoreEscalaId && e.veiculo && e.veiculo !== 'Nenhum') {
      active.add(e.veiculo);
    }
  });
  return active;
}

// ── Page Component ─────────────────────────────────────
function EscalasPage() {
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

  const [data, setData] = useState<Escala[]>(initialData);
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Escala | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [selectedLeft, setSelectedLeft] = useState<string[]>([]);
  const [selectedRight, setSelectedRight] = useState<string[]>([]);

  const [searchLeft, setSearchLeft] = useState('');
  const [searchRight, setSearchRight] = useState('');

  const activeVehicles = getActiveVehicles(data, editingItem?.id);

  const filtered = data.filter((item) => {
    const centroNome = centrosDeComandoDB.find(c => c.id === item.centroComando)?.nome || item.centroComando;
    const matchSearch =
      !search ||
      item.equipe.toLowerCase().includes(search.toLowerCase()) ||
      centroNome.toLowerCase().includes(search.toLowerCase()) ||
      item.comandante.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  function openNew() {
    setEditingItem(null);
    setForm({ ...emptyForm });
    setSelectedLeft([]);
    setSelectedRight([]);
    setSearchLeft('');
    setSearchRight('');
    setDialogOpen(true);
  }

  function openEdit(item: Escala) {
    setEditingItem(item);
    setForm({
      centroComando: item.centroComando,
      equipe: item.equipe,
      dataInicio: item.dataInicio,
      dataFim: item.dataFim,
      veiculo: item.veiculo,
      comandante: item.comandante,
      usuariosEscalados: item.usuariosEscalados,
    });
    setSelectedLeft([]);
    setSelectedRight([]);
    setSearchLeft('');
    setSearchRight('');
    setDialogOpen(true);
  }

  function handleSave() {
    if (editingItem) {
      setData((prev) => prev.map((d) => (d.id === editingItem.id ? { ...d, ...form } : d)));
    } else {
      setData((prev) => [...prev, { id: crypto.randomUUID(), ...form }]);
    }
    setDialogOpen(false);
  }

  function confirmDelete(id: string) {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  }

  function handleDelete() {
    if (deletingId) setData((prev) => prev.filter((d) => d.id !== deletingId));
    setDeleteDialogOpen(false);
    setDeletingId(null);
  }

  function toggleSelection(u: string, side: 'left' | 'right') {
    if (side === 'left') {
      setSelectedLeft(prev => prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]);
    } else {
      setSelectedRight(prev => prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]);
    }
  }

  function moveRight() {
    setForm(prev => ({ ...prev, usuariosEscalados: [...prev.usuariosEscalados, ...selectedLeft] }));
    setSelectedLeft([]);
  }

  function moveLeft() {
    setForm(prev => ({ ...prev, usuariosEscalados: prev.usuariosEscalados.filter(x => !selectedRight.includes(x)) }));
    setSelectedRight([]);
  }

  function moveAllRight() {
    const disponiveis = usuariosDisponiveis.filter(u => !form.usuariosEscalados.includes(u));
    setForm(prev => ({ ...prev, usuariosEscalados: [...prev.usuariosEscalados, ...disponiveis] }));
    setSelectedLeft([]);
  }

  function moveAllLeft() {
    setForm(prev => ({ ...prev, usuariosEscalados: [] }));
    setSelectedRight([]);
  }

  const disponiveis = usuariosDisponiveis.filter(u => !form.usuariosEscalados.includes(u)).filter(u => u.toLowerCase().includes(searchLeft.toLowerCase()));
  const escalados = form.usuariosEscalados.filter(u => u.toLowerCase().includes(searchRight.toLowerCase()));

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
                      <div className="font-bold">{item.equipe}</div>
                      <div className="text-xs text-muted-foreground">
                        {centrosDeComandoDB.find(c => c.id === item.centroComando)?.nome || item.centroComando}
                      </div>
                    </TableCell>
                    <TableCell className="mono text-sm text-muted-foreground">
                      {formatDate(item.dataInicio)} — {formatDate(item.dataFim)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-command/30 font-mono">
                        {item.veiculo}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.comandante || '—'}</TableCell>
                    <TableCell className="mono">{item.usuariosEscalados.length} usuário(s)</TableCell>
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
            <div className="grid gap-5 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Centro de Comando</Label>
                  <Select value={form.centroComando} onValueChange={(v) => setForm({ ...form, centroComando: v, equipe: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o centro" />
                    </SelectTrigger>
                    <SelectContent>
                      {centrosDeComandoDB.map((cc: any) => (
                        <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Equipe</Label>
                  <Select disabled={!form.centroComando} value={form.equipe} onValueChange={(v) => setForm({ ...form, equipe: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipesDB.filter((eq: any) => eq.centroComandoId === form.centroComando).map((eq: any) => (
                        <SelectItem key={eq.id} value={eq.nome}>{eq.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={form.dataInicio}
                    onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data Fim</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={form.dataFim}
                    onChange={(e) => setForm({ ...form, dataFim: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Veículo Associado</Label>
                  <Select value={form.veiculo} onValueChange={(v) => setForm({ ...form, veiculo: v })}>
                    <SelectTrigger className={activeVehicles.has(form.veiculo) ? 'border-warning text-warning' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nenhum">Nenhum</SelectItem>
                      {veiculosDB.map((v: any) => {
                        const label = v.prefixo || v.identificador;
                        return (
                          <SelectItem key={v.id} value={label}>
                            {label} {activeVehicles.has(label) && label !== 'Nenhum' ? '(Em uso)' : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {activeVehicles.has(form.veiculo) && form.veiculo !== 'Nenhum' && (
                    <p className="text-[10px] text-warning flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" />
                      Este veículo possui escala ativa no período.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Usuários Escalados</Label>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 h-48">
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
                      {disponiveis.map(u => (
                        <div 
                          key={u} 
                          className={cn("px-2 py-1.5 text-sm rounded cursor-pointer select-none transition-colors", selectedLeft.includes(u) ? "bg-primary text-primary-foreground" : "hover:bg-secondary/30")}
                          onClick={() => toggleSelection(u, 'left')}
                          onDoubleClick={() => {
                            setForm(prev => ({ ...prev, usuariosEscalados: [...prev.usuariosEscalados, u] }));
                            setSelectedLeft(prev => prev.filter(x => x !== u));
                          }}
                        >
                          {u}
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
                      {escalados.map(u => (
                        <div 
                          key={u} 
                          className={cn("px-2 py-1.5 text-sm rounded cursor-pointer select-none transition-colors", selectedRight.includes(u) ? "bg-primary text-primary-foreground" : "hover:bg-secondary/30")}
                          onClick={() => toggleSelection(u, 'right')}
                          onDoubleClick={() => {
                            setForm(prev => ({ ...prev, usuariosEscalados: prev.usuariosEscalados.filter(x => x !== u) }));
                            setSelectedRight(prev => prev.filter(x => x !== u));
                          }}
                        >
                          {u}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-right">Dica: Clique duplo para mover rapidamente</p>
              </div>

              <div className="space-y-2">
                <Label>Comandante da Escala</Label>
                <Select disabled={form.usuariosEscalados.length === 0} value={form.comandante} onValueChange={(v) => setForm({ ...form, comandante: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o comandante" />
                  </SelectTrigger>
                  <SelectContent>
                    {form.usuariosEscalados.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.usuariosEscalados.length === 0 && (
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

