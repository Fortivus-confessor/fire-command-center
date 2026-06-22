import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Building2, Loader2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api';

export const Route = createFileRoute('/centro-comando')({
  component: CentroComandoPage,
});

interface CentroComandoDTO {
  id?: string;
  nome: string;
  endereco: string;
  telefone: string;
  central: boolean;
  latitude: number;
  longitude: number;
}

const emptyForm: CentroComandoDTO = {
  nome: '',
  endereco: '',
  telefone: '',
  central: false,
  latitude: 0,
  longitude: 0,
};

function CentroComandoPage() {
  const queryClient = useQueryClient();

  const { data: centros = [], isLoading } = useQuery<CentroComandoDTO[]>({
    queryKey: ['centros-comando'],
    queryFn: () => fetchWithAuth('/admin/centros'),
  });

  const mutationCreateEdit = useMutation({
    mutationFn: (centro: CentroComandoDTO) => {
      const isEdit = !!centro.id;
      const url = isEdit ? `/admin/centros/${centro.id}` : '/admin/centros';
      const method = isEdit ? 'PUT' : 'POST';
      return fetchWithAuth(url, {
        method,
        body: JSON.stringify(centro),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centros-comando'] });
      setDialogOpen(false);
    },
  });

  const mutationDelete = useMutation({
    mutationFn: (id: string) => fetchWithAuth(`/admin/centros/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centros-comando'] });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
  });

  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CentroComandoDTO | null>(null);
  const [form, setForm] = useState<CentroComandoDTO>(emptyForm);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = centros.filter((item) => {
    const matchSearch =
      !search ||
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.endereco?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  function openNew() {
    setEditingItem(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  }

  function openEdit(item: CentroComandoDTO) {
    setEditingItem(item);
    setForm({
      id: item.id,
      nome: item.nome || '',
      endereco: item.endereco || '',
      telefone: item.telefone || '',
      central: item.central || false,
      latitude: item.latitude || 0,
      longitude: item.longitude || 0,
    });
    setDialogOpen(true);
  }

  function handleSave() {
    mutationCreateEdit.mutate({
      ...form,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude)
    });
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
            <Building2 className="h-6 w-6 text-command" />
            Centros de Comando
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os centros de comando regionais
          </p>
        </div>
        <Button onClick={openNew} className="bg-fire hover:bg-fire/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Novo Centro
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou endereço..."
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
                <TableHead>Nome</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum centro de comando encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-secondary/20 transition">
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>{item.endereco || '-'}</TableCell>
                    <TableCell className="mono text-sm">{item.telefone || '-'}</TableCell>
                    <TableCell>
                      {item.central ? (
                        <Badge className="bg-command/20 text-command border-command/30">Central</Badge>
                      ) : (
                        <Badge variant="secondary">Regional</Badge>
                      )}
                    </TableCell>
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
              </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Centro de Comando' : 'Novo Centro de Comando'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Atualize os dados do centro de comando.' : 'Preencha os dados para cadastrar um novo centro.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: COMCEN Principal"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="(XX) XXXX-XXXX"
                  className="mono"
                />
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Switch 
                  id="central" 
                  checked={form.central}
                  onCheckedChange={(c) => setForm({ ...form, central: c })}
                />
                <Label htmlFor="central">É um Centro Geral / Central?</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Latitude
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value as any })}
                  placeholder="-15.7801"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Longitude
                </Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value as any })}
                  placeholder="-47.9292"
                />
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={mutationCreateEdit.isPending}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-fire hover:bg-fire/90 text-white" disabled={mutationCreateEdit.isPending}>
              {mutationCreateEdit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingItem ? 'Salvar Alterações' : 'Criar Centro'}
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
              Tem certeza que deseja excluir este centro de comando? Esta ação não pode ser desfeita.
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
