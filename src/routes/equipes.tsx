import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Users, Filter, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api';
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

export const Route = createFileRoute('/equipes')({
  component: EquipesPage,
});

interface CentroComandoDTO {
  id: string;
  nome: string;
}

interface EquipeDTO {
  id?: string;
  nome: string;
  categoria: string;
  centroComandoId: string;
}

const emptyForm: EquipeDTO = {
  nome: '',
  centroComandoId: '',
  categoria: 'TERRESTRE',
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

// ── Page Component ─────────────────────────────────────
function EquipesPage() {
  const queryClient = useQueryClient();

  const [pageIndex, setPageIndex] = useState(0);
  const [listAll, setListAll] = useState(false);
  const pageSize = listAll ? 1000 : 10;

  const { data: pageData, isLoading: loadingEquipes } = useQuery<any>({
    queryKey: ['equipes', pageIndex, pageSize],
    queryFn: () => fetchWithAuth(`/admin/equipes/paged?page=${pageIndex}&size=${pageSize}`)
  });

  const equipes = pageData?.content || [];

  const { data: centros = [] } = useQuery<CentroComandoDTO[]>({
    queryKey: ['centros-comando'],
    queryFn: () => fetchWithAuth('/admin/centros'),
  });

  const mutationCreateEdit = useMutation({
    mutationFn: (equipe: EquipeDTO) => {
      const isEdit = !!equipe.id;
      const url = isEdit ? `/admin/equipes/${equipe.id}` : '/admin/equipes';
      const method = isEdit ? 'PUT' : 'POST';
      return fetchWithAuth(url, {
        method,
        body: JSON.stringify(equipe),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      setDialogOpen(false);
    },
  });

  const mutationDelete = useMutation({
    mutationFn: (id: string) => fetchWithAuth(`/admin/equipes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
  });

  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipeDTO | null>(null);
  const [form, setForm] = useState<EquipeDTO>(emptyForm);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = equipes.filter((item: EquipeDTO) => {
    const centroNome = centros.find(c => c.id === item.centroComandoId)?.nome || '';
    const matchSearch =
      !search ||
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      centroNome.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === 'all' || item.categoria === filterTipo;
    return matchSearch && matchTipo;
  });

  function openNew() {
    setEditingItem(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  }

  function openEdit(item: EquipeDTO) {
    setEditingItem(item);
    setForm({
      id: item.id,
      nome: item.nome,
      centroComandoId: item.centroComandoId || '',
      categoria: item.categoria || 'TERRESTRE',
    });
    setDialogOpen(true);
  }

  function handleSave() {
    mutationCreateEdit.mutate(form);
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

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-command" />
            Equipes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as equipes de combate e seus recursos
          </p>
        </div>
        <Button onClick={openNew} className="bg-fire hover:bg-fire/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nova Equipe
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por codinome ou centro..."
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
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden glass border border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/40">
              <TableRow>
                <TableHead>Codinome</TableHead>
                <TableHead>Centro de Comando</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingEquipes ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhuma equipe encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item: EquipeDTO) => (
                  <TableRow key={item.id} className="hover:bg-secondary/20 transition">
                    <TableCell className="mono font-bold">{item.nome}</TableCell>
                    <TableCell>{centros.find(c => c.id === item.centroComandoId)?.nome || 'Sem centro'}</TableCell>
                    <TableCell>{tipoBadge(item.categoria)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8 hover:text-command">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(item.id!)} className="h-8 w-8 hover:text-destructive">
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
        <DialogContent className="glass-strong sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Equipe' : 'Nova Equipe'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Atualize os dados da equipe.' : 'Preencha os dados para cadastrar uma nova equipe.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Codinome</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Golf-7"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
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
            </div>
            <div className="space-y-2">
              <Label>Centro de Comando</Label>
              <Select value={form.centroComandoId} onValueChange={(v) => setForm({ ...form, centroComandoId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o centro" />
                </SelectTrigger>
                <SelectContent>
                  {centros.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={mutationCreateEdit.isPending}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-fire hover:bg-fire/90 text-white" disabled={mutationCreateEdit.isPending}>
              {mutationCreateEdit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingItem ? 'Salvar Alterações' : 'Criar Equipe'}
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
              Tem certeza que deseja excluir esta equipe? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutationDelete.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={mutationDelete.isPending}>
              {mutationDelete.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

