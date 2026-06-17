import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, UserCog, Filter, Loader2 } from 'lucide-react';
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

export const Route = createFileRoute('/usuarios')({
  component: UsuariosPage,
});

type UserRole = 'ROLE_ADMIN' | 'ROLE_CENTRO_COMANDO_CENTRAL' | 'ROLE_CENTRO_COMANDO' | 'ROLE_COMBATENTE';

interface UsuarioDTO {
  id?: string;
  nome: string;
  email: string;
  cpf: string;
  perfil: string;
  estadoOperacional: string;
  centroComandoId?: string;
}

interface CentroComandoDTO {
  id: string;
  nome: string;
}

const emptyForm: UsuarioDTO = {
  nome: '',
  email: '',
  cpf: '',
  perfil: 'ROLE_COMBATENTE',
  estadoOperacional: 'DISPONIVEL',
  centroComandoId: '',
};

const roleLabels: Record<string, string> = {
  ROLE_ADMIN: 'Administrador',
  ROLE_CENTRO_COMANDO_CENTRAL: 'Centro de Comando Central',
  ROLE_CENTRO_COMANDO: 'Centro de Comando',
  ROLE_COMBATENTE: 'Combatente',
};

function roleBadge(r: string) {
  switch (r) {
    case 'ROLE_ADMIN': return <Badge className="bg-fire/20 text-fire border-fire/30">{roleLabels[r]}</Badge>;
    case 'ROLE_CENTRO_COMANDO_CENTRAL': return <Badge className="bg-command/20 text-command border-command/30">{roleLabels[r]}</Badge>;
    case 'ROLE_CENTRO_COMANDO': return <Badge className="bg-warning/20 text-warning border-warning/30">{roleLabels[r]}</Badge>;
    case 'ROLE_COMBATENTE': return <Badge className="bg-success/20 text-success border-success/30">{roleLabels[r]}</Badge>;
    default: return <Badge variant="secondary">{r}</Badge>;
  }
}

function statusBadge(s: string) {
  switch (s) {
    case 'DISPONIVEL': return <Badge className="bg-success/20 text-success border-success/30">Disponível</Badge>;
    case 'EM_MISSAO': return <Badge className="bg-fire/20 text-fire border-fire/30">Em Missão</Badge>;
    case 'FOLGA': return <Badge className="bg-info/20 text-info border-info/30">Folga</Badge>;
    case 'FERIAS': return <Badge className="bg-command/20 text-command border-command/30">Férias</Badge>;
    case 'AFASTADO': return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Afastado</Badge>;
    default: return <Badge variant="secondary">{s}</Badge>;
  }
}

function maskCpf(cpf: string) {
  if (!cpf || cpf.length < 11) return cpf;
  return `***.${cpf.slice(4, 7)}.${cpf.slice(8, 11)}-**`;
}

function UsuariosPage() {
  const queryClient = useQueryClient();

  const { data: usuarios = [], isLoading: loadingUsuarios } = useQuery<UsuarioDTO[]>({
    queryKey: ['usuarios'],
    queryFn: () => fetchWithAuth('/admin/usuarios'),
  });

  const { data: centros = [] } = useQuery<CentroComandoDTO[]>({
    queryKey: ['centros-comando'],
    queryFn: () => fetchWithAuth('/admin/centros'),
  });

  const mutationCreateEdit = useMutation({
    mutationFn: (usuario: UsuarioDTO) => {
      const formData = new FormData();
      if (usuario.id) formData.append('id', usuario.id);
      formData.append('nome', usuario.nome);
      formData.append('email', usuario.email);
      formData.append('cpf', usuario.cpf);
      formData.append('perfil', usuario.perfil);
      formData.append('estadoOperacional', usuario.estadoOperacional);
      if (usuario.centroComandoId && usuario.centroComandoId !== 'none') {
        formData.append('centroComandoId', usuario.centroComandoId);
      }
      
      return fetchWithAuth('/admin/usuarios', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setDialogOpen(false);
    },
  });

  const mutationDelete = useMutation({
    mutationFn: (id: string) => fetchWithAuth(`/admin/usuarios/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
  });

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UsuarioDTO | null>(null);
  const [form, setForm] = useState<UsuarioDTO>(emptyForm);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = usuarios.filter((item) => {
    const matchSearch =
      !search ||
      item.nome?.toLowerCase().includes(search.toLowerCase()) ||
      item.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || item.perfil === filterRole;
    return matchSearch && matchRole;
  });

  function openNew() {
    setEditingItem(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  }

  function openEdit(item: UsuarioDTO) {
    setEditingItem(item);
    setForm({
      id: item.id,
      nome: item.nome || '',
      email: item.email || '',
      cpf: item.cpf || '',
      perfil: item.perfil || 'ROLE_COMBATENTE',
      estadoOperacional: item.estadoOperacional || 'DISPONIVEL',
      centroComandoId: item.centroComandoId || '',
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
            <UserCog className="h-6 w-6 text-fire" />
            Usuários
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os usuários do sistema
          </p>
        </div>
        <Button onClick={openNew} className="bg-fire hover:bg-fire/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Roles</SelectItem>
              <SelectItem value="ROLE_ADMIN">Administrador</SelectItem>
              <SelectItem value="ROLE_CENTRO_COMANDO_CENTRAL">Centro de Comando Central</SelectItem>
              <SelectItem value="ROLE_CENTRO_COMANDO">Centro de Comando</SelectItem>
              <SelectItem value="ROLE_COMBATENTE">Combatente</SelectItem>
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
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Centro de Comando</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingUsuarios ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-secondary/20 transition">
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.email}</TableCell>
                    <TableCell className="mono text-muted-foreground">{maskCpf(item.cpf)}</TableCell>
                    <TableCell>{roleBadge(item.perfil)}</TableCell>
                    <TableCell className="text-sm">{centros.find(c => c.id === item.centroComandoId)?.nome || '-'}</TableCell>
                    <TableCell>{statusBadge(item.estadoOperacional)}</TableCell>
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
        <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
          Mostrando {filtered.length} de {usuarios.length} registros
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Atualize os dados do usuário.' : 'Preencha os dados para cadastrar um novo usuário.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome do usuário"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@fortivus.gov.br"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.perfil} onValueChange={(v) => setForm({ ...form, perfil: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROLE_ADMIN">Administrador</SelectItem>
                    <SelectItem value="ROLE_CENTRO_COMANDO_CENTRAL">Centro de Comando Central</SelectItem>
                    <SelectItem value="ROLE_CENTRO_COMANDO">Centro de Comando</SelectItem>
                    <SelectItem value="ROLE_COMBATENTE">Combatente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado Operacional</Label>
                <Select value={form.estadoOperacional} onValueChange={(v) => setForm({ ...form, estadoOperacional: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISPONIVEL">Disponível</SelectItem>
                    <SelectItem value="EM_MISSAO">Em Missão</SelectItem>
                    <SelectItem value="FOLGA">Folga</SelectItem>
                    <SelectItem value="FERIAS">Férias</SelectItem>
                    <SelectItem value="AFASTADO">Afastado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Centro de Comando</Label>
              <Select value={form.centroComandoId} onValueChange={(v) => setForm({ ...form, centroComandoId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
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
              {mutationCreateEdit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingItem ? 'Salvar Alterações' : 'Criar Usuário'}
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
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
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
