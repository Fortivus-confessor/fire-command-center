import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Truck, Filter } from 'lucide-react';
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

export const Route = createFileRoute('/veiculos')({
  component: VeiculosPage,
});

// ── Types ──────────────────────────────────────────────
interface Veiculo {
  id: string;
  identificador: string;
  prefixo: string;
  modelo: string;
  tipo: 'Terrestre' | 'Aéreo' | 'Maquinário' | 'Aquático';
  contrato: 'Locado' | 'Órgão de Apoio' | 'Próprio';
}

// ── Mock Data ──────────────────────────────────────────
const initialData: Veiculo[] = [
  { id: '1', identificador: 'ABC-1234', prefixo: 'VTR-01', modelo: 'Caminhão ABTR', tipo: 'Terrestre', contrato: 'Próprio' },
  { id: '2', identificador: 'PR-HFB', prefixo: '', modelo: 'Helicóptero AS350', tipo: 'Aéreo', contrato: 'Locado' },
  { id: '3', identificador: 'PAR-8B55', prefixo: 'VTR-02', modelo: 'Viatura L200', tipo: 'Terrestre', contrato: 'Próprio' },
  { id: '4', identificador: 'MQN-0012', prefixo: '', modelo: 'Trator de esteira D6', tipo: 'Maquinário', contrato: 'Órgão de Apoio' },
  { id: '5', identificador: 'TOC-3C47', prefixo: 'VTR-05', modelo: 'Caminhão Pipa', tipo: 'Terrestre', contrato: 'Locado' },
];

const emptyForm: Omit<Veiculo, 'id'> = {
  identificador: '',
  prefixo: '',
  modelo: '',
  tipo: 'TERRESTRE' as any,
  contrato: 'Próprio',
};

// ── Helpers ────────────────────────────────────────────
function tipoBadge(t: string) {
  switch (t) {
    case 'TERRESTRE': return <Badge className="bg-success/20 text-success border-success/30">Terrestre</Badge>;
    case 'AEREO': return <Badge className="bg-command/20 text-command border-command/30">Aéreo</Badge>;
    case 'MAQUINARIO': return <Badge className="bg-warning/20 text-warning border-warning/30">Maquinário</Badge>;
    case 'AQUATICO': return <Badge className="bg-info/20 text-info border-info/30 text-blue-400">Aquático</Badge>;
    default: return <Badge variant="secondary">{t}</Badge>;
  }
}

function contratoBadge(c: string) {
  switch (c) {
    case 'Próprio': return <Badge className="bg-command/20 text-command border-command/30">{c}</Badge>;
    case 'Locado': return <Badge className="bg-warning/20 text-warning border-warning/30">{c}</Badge>;
    case 'Órgão de Apoio': return <Badge className="bg-info/20 text-info border-info/30 text-blue-400">{c}</Badge>;
    default: return <Badge variant="secondary">{c}</Badge>;
  }
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '../lib/api';

// ── Page Component ─────────────────────────────────────
function VeiculosPage() {
  const queryClient = useQueryClient();

  const { data: veiculosData = [], isLoading } = useQuery<Veiculo[]>({
    queryKey: ['veiculos'],
    queryFn: () => fetchWithAuth('/ativos/frota')
  });

  const saveMutation = useMutation({
    mutationFn: async (veiculo: any) => {
      const formData = new FormData();
      if (veiculo.id) formData.append('id', veiculo.id);
      formData.append('identificador', veiculo.identificador);
      formData.append('prefixo', veiculo.prefixo || '');
      formData.append('modelo', veiculo.modelo);
      formData.append('categoria', veiculo.tipo);
      // O contrato no backend não existe em Veiculo, o backend tem EquipeId. Vamos mockar o envio ou adaptar?
      // O backend do Fortivus Veiculo não tem campo "contrato" e "tipo" é "categoria".
      
      return fetchWithAuth('/ativos/frota', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['veiculos'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchWithAuth(`/ativos/frota/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['veiculos'] })
  });

  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterContrato, setFilterContrato] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Veiculo | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = veiculosData.filter((item: any) => {
    // Adapter do backend (categoria -> tipo)
    const tipoItem = item.categoria || item.tipo;
    const matchSearch =
      !search ||
      (item.identificador && item.identificador.toLowerCase().includes(search.toLowerCase())) ||
      (item.modelo && item.modelo.toLowerCase().includes(search.toLowerCase())) ||
      (item.prefixo && item.prefixo.toLowerCase().includes(search.toLowerCase()));
    const matchTipo = filterTipo === 'all' || tipoItem === filterTipo;
    return matchSearch && matchTipo;
  });

  function openNew() {
    setEditingItem(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  }

  function openEdit(item: any) {
    setEditingItem(item);
    setForm({
      identificador: item.identificador || '',
      prefixo: item.prefixo || '',
      modelo: item.modelo || '',
      tipo: item.categoria || item.tipo || 'TERRESTRE',
      contrato: item.contrato || 'Próprio', // mock field
    });
    setDialogOpen(true);
  }

  function handleSave() {
    saveMutation.mutate({
      id: editingItem?.id,
      ...form
    });
    setDialogOpen(false);
  }

  function confirmDelete(id: string) {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  }

  function handleDelete() {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
    setDeleteDialogOpen(false);
    setDeletingId(null);
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Truck className="h-6 w-6 text-command" />
            Veículos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie a frota de veículos, aeronaves e maquinários
          </p>
        </div>
        <Button onClick={openNew} className="bg-fire hover:bg-fire/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Novo Veículo
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por placa, prefixo ou modelo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="TERRESTRE">Terrestre</SelectItem>
              <SelectItem value="AEREO">Aéreo</SelectItem>
              <SelectItem value="MAQUINARIO">Maquinário</SelectItem>
              <SelectItem value="AQUATICO">Aquático</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterContrato} onValueChange={setFilterContrato}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Contrato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Contratos</SelectItem>
              <SelectItem value="Próprio">Próprio</SelectItem>
              <SelectItem value="Locado">Locado</SelectItem>
              <SelectItem value="Órgão de Apoio">Órgão de Apoio</SelectItem>
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
                <TableHead>Prefixo</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum veículo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-secondary/20 transition">
                    <TableCell className="mono font-bold">{item.identificador}</TableCell>
                    <TableCell className="mono">{ (item.categoria || item.tipo) === 'TERRESTRE' ? (item.prefixo || '-') : '-'}</TableCell>
                    <TableCell>{item.modelo}</TableCell>
                    <TableCell>{tipoBadge(item.categoria || item.tipo)}</TableCell>
                    <TableCell>{contratoBadge(item.contrato || 'Próprio')}</TableCell>
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
          Mostrando {filtered.length} de {veiculosData.length} registros
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Atualize os dados do veículo.' : 'Preencha os dados para cadastrar um novo veículo.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as Veiculo['tipo'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TERRESTRE">Terrestre</SelectItem>
                  <SelectItem value="AEREO">Aéreo</SelectItem>
                  <SelectItem value="MAQUINARIO">Maquinário</SelectItem>
                  <SelectItem value="AQUATICO">Aquático</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="identificador">Identificador (Placa/Código)</Label>
                <Input
                  id="identificador"
                  value={form.identificador}
                  onChange={(e) => setForm({ ...form, identificador: e.target.value })}
                  placeholder="Ex: ABC-1D23"
                  className="mono"
                />
              </div>
              {form.tipo === 'TERRESTRE' && (
                <div className="space-y-2">
                  <Label htmlFor="prefixo">Prefixo</Label>
                  <Input
                    id="prefixo"
                    value={form.prefixo}
                    onChange={(e) => setForm({ ...form, prefixo: e.target.value })}
                    placeholder="Ex: VTR-01"
                    className="mono"
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  value={form.modelo}
                  onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                  placeholder="Ex: Caminhão ABTR"
                />
              </div>
              <div className="space-y-2">
                <Label>Contrato</Label>
                <Select value={form.contrato} onValueChange={(v) => setForm({ ...form, contrato: v as Veiculo['contrato'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Próprio">Próprio</SelectItem>
                    <SelectItem value="Locado">Locado</SelectItem>
                    <SelectItem value="Órgão de Apoio">Órgão de Apoio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-fire hover:bg-fire/90 text-white">
              {editingItem ? 'Salvar Alterações' : 'Criar Veículo'}
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
              Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.
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
