import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, UserCog, Filter, Loader2, ChevronLeft, ChevronRight, Eye, EyeOff, User, X } from 'lucide-react';
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

interface UsuarioDTO {
  id?: string;
  nome: string;
  email: string;
  cpf: string;
  perfil: string;
  estadoOperacional: string;
  centroComandoId?: string;
  
  rg?: string;
  matricula?: string;
  dataNascimento?: string;
  tipoSanguineo?: string;
  fotoUrl?: string;
  
  senha?: string;
  confirmarSenha?: string;
  fotoArquivo?: File | null;
  removeExistingPhoto?: boolean;
}

interface CentroComandoDTO {
  id: string;
  nome: string;
}

const emptyForm: UsuarioDTO = {
  nome: '',
  email: '',
  cpf: '',
  perfil: '',
  estadoOperacional: '',
  centroComandoId: '',
  rg: '',
  matricula: '',
  dataNascimento: '',
  tipoSanguineo: '',
  senha: '',
  confirmarSenha: '',
  fotoArquivo: null,
  removeExistingPhoto: false,
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

  const [pageIndex, setPageIndex] = useState(0);
  const [listAll, setListAll] = useState(false);
  const pageSize = listAll ? 1000 : 10;

  const { data: pageData, isLoading: loadingUsuarios } = useQuery<any>({
    queryKey: ['usuarios', pageIndex, pageSize],
    queryFn: () => fetchWithAuth(`/admin/usuarios/paged?page=${pageIndex}&size=${pageSize}`)
  });

  const usuarios = pageData?.content || [];

  const { data: centros = [] } = useQuery<CentroComandoDTO[]>({
    queryKey: ['centros-comando'],
    queryFn: () => fetchWithAuth('/admin/centros'),
  });

  const mutationCreateEdit = useMutation({
    mutationFn: async (usuario: UsuarioDTO) => {
      if (usuario.removeExistingPhoto && usuario.id) {
        await fetchWithAuth(`/admin/usuarios/${usuario.id}/foto`, { method: 'DELETE' }).catch(console.error);
      }
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
      
      if (usuario.rg) formData.append('rg', usuario.rg);
      if (usuario.matricula) formData.append('matricula', usuario.matricula);
      if (usuario.dataNascimento) formData.append('dataNascimento', usuario.dataNascimento);
      if (usuario.tipoSanguineo) formData.append('tipoSanguineo', usuario.tipoSanguineo);
      if (usuario.senha) formData.append('senha', usuario.senha);
      if (usuario.fotoArquivo) formData.append('fotoArquivo', usuario.fotoArquivo);
      
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<UsuarioDTO | null>(null);

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  function openImageModal(url: string) {
    setImageModalUrl(url);
    setImageModalOpen(true);
  }

  function openView(item: UsuarioDTO) {
    setViewingItem(item);
    setViewDialogOpen(true);
  }

  const filtered = usuarios.filter((item: UsuarioDTO) => {
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
    setPreviewUrl(null);
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setDialogOpen(true);
  }

  function openEdit(item: UsuarioDTO) {
    setEditingItem(item);
    setForm({
      id: item.id,
      nome: item.nome || '',
      email: item.email || '',
      cpf: item.cpf || '',
      perfil: item.perfil || '',
      estadoOperacional: item.estadoOperacional || '',
      centroComandoId: item.centroComandoId || '',
      rg: item.rg || '',
      matricula: item.matricula || '',
      dataNascimento: item.dataNascimento || '',
      tipoSanguineo: item.tipoSanguineo || '',
      senha: '',
      confirmarSenha: '',
      fotoArquivo: null,
      removeExistingPhoto: false,
    });
    setPreviewUrl(item.fotoUrl || null);
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setDialogOpen(true);
  }

  function validateForm() {
    const newErrors: Record<string, boolean> = {};
    if (!form.nome) newErrors.nome = true;
    if (!form.email) newErrors.email = true;
    if (!form.cpf) newErrors.cpf = true;
    if (!form.perfil) newErrors.perfil = true;
    if (!form.estadoOperacional) newErrors.estadoOperacional = true;
    if (!form.centroComandoId || form.centroComandoId === 'none') newErrors.centroComandoId = true;
    
    if (!editingItem && !form.senha) newErrors.senha = true;
    if (form.senha && !form.confirmarSenha) newErrors.confirmarSenha = true;
    if (form.senha && form.confirmarSenha && form.senha !== form.confirmarSenha) {
       newErrors.senha = true;
       newErrors.confirmarSenha = true;
       alert('As senhas não coincidem!');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSave() {
    if (!validateForm()) return;
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
            Gerenciamento de usuários e permissões do sistema
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
            <SelectTrigger className="w-[180px]">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Roles</SelectItem>
              <SelectItem value="ROLE_ADMIN">Administrador</SelectItem>
              <SelectItem value="ROLE_CENTRO_COMANDO_CENTRAL">Centro de Comando Central</SelectItem>
              <SelectItem value="ROLE_CENTRO_COMANDO">Centro de Comando</SelectItem>
              <SelectItem value="ROLE_COMBATENTE">Combatente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden glass border border-border flex flex-col">
        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader className="bg-secondary/40">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Centro de Comando</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingUsuarios ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item: UsuarioDTO) => (
                  <TableRow key={item.id} className="hover:bg-secondary/20 transition">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {item.fotoUrl && (
                          <div 
                            className="w-8 h-8 rounded-full overflow-hidden border border-border cursor-pointer hover:ring-2 hover:ring-primary transition shrink-0"
                            onClick={() => openImageModal(item.fotoUrl!)}
                            title="Ver imagem grande"
                          >
                            <img src={item.fotoUrl} alt="Foto" className="w-full h-full object-cover" />
                          </div>
                        )}
                        {!item.fotoUrl && (
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border shrink-0">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        {item.nome}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.email}</TableCell>
                    <TableCell className="mono text-muted-foreground">{maskCpf(item.cpf)}</TableCell>
                    <TableCell>{roleBadge(item.perfil)}</TableCell>
                    <TableCell className="text-sm">{centros.find(c => c.id === item.centroComandoId)?.nome || '-'}</TableCell>
                    <TableCell>{statusBadge(item.estadoOperacional)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openView(item)} className="h-8 w-8 hover:text-info" title="Visualizar">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8 hover:text-command" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(item.id!)} className="h-8 w-8 hover:text-destructive" title="Excluir">
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
            <DialogTitle>{editingItem ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Atualize os dados do usuário.' : 'Preencha os dados para cadastrar um novo usuário.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
            {/* Foto Input */}
            <div className="space-y-2">
              <Label htmlFor="fotoArquivo">Foto do Usuário (Máx 10MB, JPG/PNG)</Label>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {previewUrl && (
                  <div className="relative w-32 h-32 rounded-lg border border-border overflow-hidden shrink-0 group">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          setPreviewUrl(null);
                          setForm({ ...form, fotoArquivo: null, removeExistingPhoto: true });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex-1 w-full">
                  <Input
                    id="fotoArquivo"
                    type="file"
                    accept="image/jpeg, image/png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          alert('A foto deve ter no máximo 10MB.');
                          e.target.value = '';
                          return;
                        }
                        setForm({ ...form, fotoArquivo: file, removeExistingPhoto: false });
                        setPreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {previewUrl ? 'Selecione outra foto para substituir.' : 'Selecione uma foto para o usuário.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className={errors.nome ? 'text-destructive' : ''}>Nome Completo *</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome do usuário"
                  className={errors.nome ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className={errors.email ? 'text-destructive' : ''}>Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@fortivus.gov.br"
                  className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf" className={errors.cpf ? 'text-destructive' : ''}>CPF *</Label>
                <Input
                  id="cpf"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className={`mono ${errors.cpf ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={form.rg}
                  onChange={(e) => setForm({ ...form, rg: e.target.value })}
                  placeholder="RG"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  value={form.matricula}
                  onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                  placeholder="Ex: 12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={form.dataNascimento}
                  onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo Sanguíneo</Label>
                <Select value={form.tipoSanguineo} onValueChange={(v) => setForm({ ...form, tipoSanguineo: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={errors.perfil ? 'text-destructive' : ''}>Role *</Label>
                <Select value={form.perfil} onValueChange={(v) => setForm({ ...form, perfil: v })}>
                  <SelectTrigger className={errors.perfil ? 'border-destructive focus:ring-destructive' : ''}>
                    <SelectValue placeholder="Selecione uma role" />
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
                <Label className={errors.estadoOperacional ? 'text-destructive' : ''}>Estado Operacional *</Label>
                <Select value={form.estadoOperacional} onValueChange={(v) => setForm({ ...form, estadoOperacional: v })}>
                  <SelectTrigger className={errors.estadoOperacional ? 'border-destructive focus:ring-destructive' : ''}>
                    <SelectValue placeholder="Selecione um status" />
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
              <Label className={errors.centroComandoId ? 'text-destructive' : ''}>Centro de Comando *</Label>
              <Select value={form.centroComandoId} onValueChange={(v) => setForm({ ...form, centroComandoId: v })}>
                <SelectTrigger className={errors.centroComandoId ? 'border-destructive focus:ring-destructive' : ''}>
                  <SelectValue placeholder="Selecione um centro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {centros.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!editingItem && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="senha" className={errors.senha ? 'text-destructive' : ''}>Senha *</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? 'text' : 'password'}
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    placeholder="Digite a senha"
                    className={errors.senha ? 'border-destructive focus-visible:ring-destructive pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmarSenha" className={errors.confirmarSenha ? 'text-destructive' : ''}>Confirmar Senha *</Label>
                <div className="relative">
                  <Input
                    id="confirmarSenha"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmarSenha}
                    onChange={(e) => setForm({ ...form, confirmarSenha: e.target.value })}
                    placeholder="Confirme a senha"
                    className={errors.confirmarSenha ? 'border-destructive focus-visible:ring-destructive pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            )}

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={mutationCreateEdit.isPending}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-fire hover:bg-fire/90 text-white" disabled={mutationCreateEdit.isPending}>
              {mutationCreateEdit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingItem ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="glass-strong sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações completas do usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {viewingItem && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {viewingItem.fotoUrl && (
                  <div className="col-span-2 flex justify-center mb-4">
                    <img src={viewingItem.fotoUrl} alt="Foto" className="w-32 h-32 object-cover rounded-full border-4 border-secondary shadow-md" />
                  </div>
                )}
                {viewingItem.nome && <><div className="font-semibold text-muted-foreground text-right">Nome:</div><div>{viewingItem.nome}</div></>}
                {viewingItem.email && <><div className="font-semibold text-muted-foreground text-right">E-mail:</div><div>{viewingItem.email}</div></>}
                {viewingItem.cpf && <><div className="font-semibold text-muted-foreground text-right">CPF:</div><div className="mono">{viewingItem.cpf}</div></>}
                {viewingItem.rg && <><div className="font-semibold text-muted-foreground text-right">RG:</div><div>{viewingItem.rg}</div></>}
                {viewingItem.matricula && <><div className="font-semibold text-muted-foreground text-right">Matrícula:</div><div>{viewingItem.matricula}</div></>}
                {viewingItem.dataNascimento && <><div className="font-semibold text-muted-foreground text-right">Data Nasc.:</div><div>{viewingItem.dataNascimento.split('-').reverse().join('/')}</div></>}
                {viewingItem.tipoSanguineo && <><div className="font-semibold text-muted-foreground text-right">Tipo Sanguíneo:</div><div>{viewingItem.tipoSanguineo}</div></>}
                {viewingItem.perfil && <><div className="font-semibold text-muted-foreground text-right">Role:</div><div>{roleLabels[viewingItem.perfil] || viewingItem.perfil}</div></>}
                {viewingItem.estadoOperacional && <><div className="font-semibold text-muted-foreground text-right">Estado Operacional:</div><div>{viewingItem.estadoOperacional}</div></>}
                {viewingItem.centroComandoId && <><div className="font-semibold text-muted-foreground text-right">Centro Comando:</div><div>{centros.find(c => c.id === viewingItem.centroComandoId)?.nome || '-'}</div></>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)} variant="outline">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-1 bg-black/90 border-none flex justify-center items-center">
          {imageModalUrl && (
             <img src={imageModalUrl} alt="Usuário Ampliado" className="max-w-full max-h-[85vh] object-contain rounded-md" />
          )}
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
