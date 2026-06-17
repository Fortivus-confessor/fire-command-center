import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, FileText, Filter, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SituationMap } from '../components/fortivus/map/SituationMap';
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
});

// ── Types ──────────────────────────────────────────────
interface OrdemServico {
  id: string;
  codigo: string;
  comando: string;
  equipe: string;
  tipoDespacho: 'Combate Incêndio Terrestre' | 'Combate Incêndio Aéreo' | 'Combate Incêndio Maquinário';
  prioridade: 'P1' | 'P2' | 'P3';
  status: 'Rascunho' | 'Aprovada' | 'Em andamento' | 'Concluída';
  responsavel: string;
  descricao: string;
  latLng: string;
  criadaHa: string;
}

// ── Mock Data ──────────────────────────────────────────
const initialData: OrdemServico[] = [
  { id: '1', codigo: 'OS-2025-001', comando: 'Base Norte', equipe: 'Alfa-1', tipoDespacho: 'Combate Incêndio Terrestre', prioridade: 'P1', status: 'Em andamento', responsavel: 'Cap. Silva', descricao: 'Fogo em vegetação rasteira próximo à rodovia', latLng: '-15.601, -56.097', criadaHa: '2h' },
  { id: '2', codigo: 'OS-2025-002', comando: 'Base Sul', equipe: 'Bravo-2', tipoDespacho: 'Combate Incêndio Aéreo', prioridade: 'P1', status: 'Aprovada', responsavel: 'Maj. Santos', descricao: 'Apoio aéreo para resfriamento de bordas', latLng: '-11.859, -55.505', criadaHa: '4h' },
];

const centrosDeComando = ['Base Norte', 'Base Sul', 'Base Leste', 'Base Oeste', 'Centro Operacional'];
const equipesMap: Record<string, string[]> = {
  'Base Norte': ['Alfa-1', 'Charlie-3'],
  'Base Sul': ['Bravo-2'],
  'Base Leste': ['Delta-4'],
  'Base Oeste': ['Echo-5'],
  'Centro Operacional': ['Foxtrot-6'],
};
const usuariosMap: Record<string, string[]> = {
  'Alfa-1': ['Cap. Silva', 'Sgt. Pereira'],
  'Bravo-2': ['Maj. Santos', 'Ten. Costa'],
  'Charlie-3': ['Sgt. Dias', 'Cb. Mendes'],
  'Delta-4': ['Ten. Oliveira', 'Cb. Lima'],
  'Echo-5': ['Cap. Ferreira', 'Sd. Rocha'],
  'Foxtrot-6': ['Cel. Souza'],
};

const emptyForm: Omit<OrdemServico, 'id'> = {
  codigo: '',
  comando: '',
  equipe: '',
  tipoDespacho: 'Combate Incêndio Terrestre',
  prioridade: 'P2',
  status: 'Em andamento',
  responsavel: '',
  descricao: '',
  latLng: '',
  criadaHa: 'agora',
};

// ── Helpers ────────────────────────────────────────────
function prioridadeBadge(p: string) {
  switch (p) {
    case 'P1': return <Badge className="bg-fire/20 text-fire border-fire/30">P1</Badge>;
    case 'P2': return <Badge className="bg-warning/20 text-warning border-warning/30">P2</Badge>;
    case 'P3': return <Badge className="bg-command/20 text-command border-command/30">P3</Badge>;
    default: return <Badge variant="secondary">{p}</Badge>;
  }
}

function statusBadge(s: string) {
  switch (s) {
    case 'Rascunho': return <Badge variant="secondary">{s}</Badge>;
    case 'Aprovada': return <Badge className="bg-command/20 text-command border-command/30">{s}</Badge>;
    case 'Em andamento': return <Badge className="bg-fire/20 text-fire border-fire/30">{s}</Badge>;
    case 'Concluída': return <Badge className="bg-success/20 text-success border-success/30">{s}</Badge>;
    default: return <Badge variant="secondary">{s}</Badge>;
  }
}

function tipoBadge(t: string) {
  if (t.includes('Terrestre')) return <Badge className="bg-success/20 text-success border-success/30">Terrestre</Badge>;
  if (t.includes('Aéreo')) return <Badge className="bg-command/20 text-command border-command/30">Aéreo</Badge>;
  if (t.includes('Maquinário')) return <Badge className="bg-warning/20 text-warning border-warning/30">Maquinário</Badge>;
  return <Badge variant="secondary">{t}</Badge>;
}

// ── Page Component ─────────────────────────────────────
function OrdensServicoPage() {
  const [data, setData] = useState<OrdemServico[]>(initialData);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPrioridade, setFilterPrioridade] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrdemServico | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Filtered data ──
  const filtered = data.filter((item) => {
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
    const nextNum = data.length + 1;
    setForm({ ...emptyForm, codigo: `OS-2025-${String(nextNum).padStart(3, '0')}` });
    setDialogOpen(true);
  }

  function openEdit(item: OrdemServico) {
    setEditingItem(item);
    setForm({
      codigo: item.codigo,
      comando: item.comando,
      equipe: item.equipe,
      tipoDespacho: item.tipoDespacho,
      prioridade: item.prioridade,
      status: item.status,
      responsavel: item.responsavel,
      descricao: item.descricao,
      latLng: item.latLng,
      criadaHa: item.criadaHa,
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (editingItem) {
      setData((prev) =>
        prev.map((d) => (d.id === editingItem.id ? { ...d, ...form } : d))
      );
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
    if (deletingId) {
      setData((prev) => prev.filter((d) => d.id !== deletingId));
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
            Ordens de Serviço e Despachos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie Ordens de Serviço integradas aos Despachos de Combate
          </p>
        </div>
        <Button onClick={openNew} className="bg-fire hover:bg-fire/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nova OS e Despacho
        </Button>
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
                <TableHead>Código</TableHead>
                <TableHead>Comando / Equipe</TableHead>
                <TableHead>Tipo Despacho</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada há</TableHead>
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
        <DialogContent className="glass-strong sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar OS e Despacho' : 'Nova OS e Despacho'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Atualize os dados da OS.' : 'Preencha os dados para criar a OS e realizar o despacho simultaneamente.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingItem && (
              <div className="space-y-2">
                <Label htmlFor="codigo">Código OS</Label>
                <Input id="codigo" value={form.codigo} readOnly className="mono bg-secondary/30" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Despacho</Label>
                <Select value={form.tipoDespacho} onValueChange={(v) => setForm({ ...form, tipoDespacho: v as OrdemServico['tipoDespacho'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Combate Incêndio Terrestre">Combate Incêndio Terrestre</SelectItem>
                    <SelectItem value="Combate Incêndio Aéreo">Combate Incêndio Aéreo</SelectItem>
                    <SelectItem value="Combate Incêndio Maquinário">Combate Incêndio Maquinário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Comando (Centro)</Label>
                <Select value={form.comando} onValueChange={(v) => setForm({ ...form, comando: v, equipe: '', responsavel: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o comando" />
                  </SelectTrigger>
                  <SelectContent>
                    {centrosDeComando.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Equipe</Label>
                <Select disabled={!form.comando} value={form.equipe} onValueChange={(v) => setForm({ ...form, equipe: v, responsavel: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {form.comando && equipesMap[form.comando]?.map(eq => <SelectItem key={eq} value={eq}>{eq}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Usuário Responsável</Label>
              <Select disabled={!form.equipe} value={form.responsavel} onValueChange={(v) => setForm({ ...form, responsavel: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {form.equipe && usuariosMap[form.equipe]?.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição / Instruções</Label>
              <Textarea
                id="descricao"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Detalhes da ocorrência e instruções de combate..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Localização (Mapa)</Label>
              <div className="border border-border rounded-md overflow-hidden relative h-[300px] bg-secondary/20">
                <SituationMap
                  onClickMap={(lat, lng) => setForm({ ...form, latLng: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })}
                  activePin={form.latLng ? { lat: parseFloat(form.latLng.split(',')[0]), lng: parseFloat(form.latLng.split(',')[1]) } : null}
                />
                {form.latLng && (
                  <div className="absolute top-3 left-3 z-[1000] glass rounded-lg px-2.5 py-1.5 text-xs text-command font-mono border border-command/30 pointer-events-none shadow-xl">
                    Selecionado: {form.latLng}
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground mt-1 block">Clique no mapa para registrar as coordenadas do despacho.</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v as OrdemServico['prioridade'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P1">P1 – Crítica</SelectItem>
                    <SelectItem value="P2">P2 – Alta</SelectItem>
                    <SelectItem value="P3">P3 – Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingItem && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as OrdemServico['status'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rascunho">Rascunho</SelectItem>
                      <SelectItem value="Aprovada">Aprovada</SelectItem>
                      <SelectItem value="Em andamento">Em andamento</SelectItem>
                      <SelectItem value="Concluída">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-fire hover:bg-fire/90 text-white">
              {editingItem ? 'Salvar Alterações' : 'Criar OS e Despacho'}
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
              Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.
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
