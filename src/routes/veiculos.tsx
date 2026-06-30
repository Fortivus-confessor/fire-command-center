import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Truck, Filter, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react';
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
  tipo: 'TERRESTRE' | 'AEREO' | 'MAQUINARIO' | 'AQUATICO';
  categoria?: 'TERRESTRE' | 'AEREO' | 'MAQUINARIO' | 'AQUATICO';
  contrato: 'Locado' | 'Órgão de Apoio' | 'Próprio';
  fotoUrl?: string;
  centroComandoId?: string;
}

const emptyForm = {
  identificador: '',
  prefixo: '',
  modelo: '',
  tipo: '' as any,
  contrato: '' as any,
  fotoArquivo: null as File | null,
  centroComando: '',
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
import { useCanAccess } from '../hooks/useCanAccess';
import { useAuth } from '../contexts/AuthContext';

// ── Page Component ─────────────────────────────────────
function VeiculosPage() {
  const queryClient = useQueryClient();
  const canManage = useCanAccess('veiculos', 'edit');
  const { role, user } = useAuth();

  const { data: veiculosData = [], isLoading } = useQuery<Veiculo[]>({
    queryKey: ['veiculos'],
    queryFn: () => fetchWithAuth('/ativos/frota')
  });

  const { data: centrosDeComandoDB = [] } = useQuery<any[]>({
    queryKey: ['centros-comando'],
    queryFn: () => fetchWithAuth('/admin/centros'),
  });

  const saveMutation = useMutation({
    mutationFn: async (veiculo: any) => {
      if (veiculo.removeExistingPhoto && veiculo.id) {
        await fetchWithAuth(`/ativos/frota/${veiculo.id}/foto`, { method: 'DELETE' }).catch(console.error);
      }

      const formData = new FormData();
      if (veiculo.id) formData.append('id', veiculo.id);
      formData.append('identificador', veiculo.identificador);
      formData.append('prefixo', veiculo.tipo === 'TERRESTRE' ? (veiculo.prefixo || '') : '');
      formData.append('modelo', veiculo.modelo);
      formData.append('categoria', veiculo.tipo);
      if (veiculo.contrato) {
        formData.append('contrato', veiculo.contrato);
      }
      if (veiculo.centroComando && veiculo.centroComando !== 'Nenhum') {
        formData.append('centroComandoId', veiculo.centroComando);
      }
      if (veiculo.fotoArquivo) {
        formData.append('fotoArquivo', veiculo.fotoArquivo);
      }
      
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<any>(null);

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  function openImageModal(url: string) {
    setImageModalUrl(url);
    setImageModalOpen(true);
  }

  const { data: todosUsuarios = [] } = useQuery<any[]>({
    queryKey: ['usuarios-lista-cc'],
    queryFn: () => fetchWithAuth('/admin/usuarios'),
    enabled: role === 'CENTRO_COMANDO', // só busca todos os usuários quando necessário para filtro de CC
    staleTime: 5 * 60 * 1000,
  });

  const currentUser = todosUsuarios.find((u: any) => u.email === user?.email);
  const myCentroComandoId = currentUser?.centroComandoId ? String(currentUser.centroComandoId) : '';
  const isCentroComando = role === 'CENTRO_COMANDO';

  const filtered = veiculosData.filter((item: any) => {
    // CC restriction
    if (isCentroComando && String(item.centroComandoId) !== myCentroComandoId) {
      return false;
    }
    // Adapter do backend (categoria -> tipo)
    const tipoItem = item.categoria || item.tipo;
    const contratoItem = item.contrato || 'Próprio';
    const matchSearch =
      !search ||
      (item.identificador && item.identificador.toLowerCase().includes(search.toLowerCase())) ||
      (item.modelo && item.modelo.toLowerCase().includes(search.toLowerCase())) ||
      (item.prefixo && item.prefixo.toLowerCase().includes(search.toLowerCase()));
    const matchTipo = filterTipo === 'all' || tipoItem === filterTipo;
    const matchContrato = filterContrato === 'all' || contratoItem === filterContrato;
    return matchSearch && matchTipo && matchContrato;
  });

  function openView(item: any) {
    setViewingItem(item);
    setViewDialogOpen(true);
  }

  function openNew() {
    setEditingItem(null);
    setForm({ ...emptyForm, centroComando: isCentroComando ? myCentroComandoId : '' });
    setPreviewUrl(null);
    setRemoveExistingPhoto(false);
    setFormError(null);
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(item: any) {
    setEditingItem(item);
    setForm({
      identificador: item.identificador || '',
      prefixo: item.prefixo || '',
      modelo: item.modelo || '',
      tipo: item.categoria || item.tipo || '',
      contrato: item.contrato || '',
      fotoArquivo: null,
      centroComando: item.centroComandoId || '',
    });
    setPreviewUrl(item.fotoUrl || null);
    setRemoveExistingPhoto(false);
    setFormError(null);
    setErrors({});
    setDialogOpen(true);
  }

  function handleSave() {
    setFormError(null);
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!form.tipo) newErrors.tipo = "Selecione o tipo.";
    if (!form.centroComando || form.centroComando === 'Nenhum') newErrors.centroComando = "Selecione o centro de comando.";
    if (!form.identificador) newErrors.identificador = "Informe o identificador.";
    if (form.tipo === 'TERRESTRE' && !form.prefixo) newErrors.prefixo = "Informe o prefixo.";
    if (!form.modelo) newErrors.modelo = "Informe o modelo.";
    if (!form.contrato) newErrors.contrato = "Selecione o contrato.";

    const identificadorExiste = veiculosData.some((v: any) => v.identificador.toLowerCase() === form.identificador?.toLowerCase() && v.id !== editingItem?.id);
    if (identificadorExiste) {
      newErrors.identificador = "Já existe um veículo cadastrado com este identificador.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormError('Por favor, corrija os erros destacados abaixo.');
      return;
    }

    saveMutation.mutate({
      id: editingItem?.id,
      removeExistingPhoto,
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
        {(canManage || isCentroComando) && (
        <Button onClick={openNew} className="bg-fire hover:bg-fire/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Novo Veículo
        </Button>
        )}
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
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {item.fotoUrl && (
                          <div 
                            className="w-8 h-8 rounded-full overflow-hidden border border-border cursor-pointer hover:ring-2 hover:ring-primary transition shrink-0"
                            onClick={() => openImageModal(item.fotoUrl as string)}
                            title="Ver imagem grande"
                          >
                            <img src={item.fotoUrl} alt="Foto" className="w-full h-full object-cover" />
                          </div>
                        )}
                        {!item.fotoUrl && (
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border shrink-0">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        {item.identificador}
                      </div>
                    </TableCell>
                    <TableCell className="mono">{ (item.categoria || item.tipo) === 'TERRESTRE' ? (item.prefixo || '-') : '-'}</TableCell>
                    <TableCell>{item.modelo}</TableCell>
                    <TableCell>{tipoBadge(item.categoria || item.tipo)}</TableCell>
                    <TableCell>{contratoBadge(item.contrato || 'Próprio')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openView(item)} className="h-8 w-8 hover:text-primary">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(canManage || (isCentroComando && String(item.centroComandoId) === myCentroComandoId)) && (
                        <>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8 hover:text-command">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(item.id)} className="h-8 w-8 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        </>
                        )}
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
            <DialogTitle>{editingItem ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Atualize os dados do veículo.' : 'Preencha os dados para cadastrar um novo veículo.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className={errors.tipo ? "text-destructive" : ""}>Tipo *</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as Veiculo['tipo'] })}>
                <SelectTrigger className={errors.tipo ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TERRESTRE">Terrestre</SelectItem>
                  <SelectItem value="AEREO">Aéreo</SelectItem>
                  <SelectItem value="MAQUINARIO">Maquinário</SelectItem>
                  <SelectItem value="AQUATICO">Aquático</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo && <p className="text-xs text-destructive">{errors.tipo}</p>}
            </div>
            <div className="space-y-2">
              <Label className={errors.centroComando ? "text-destructive" : ""}>Centro de Comando *</Label>
              <Select disabled={isCentroComando} value={form.centroComando} onValueChange={(v) => setForm({ ...form, centroComando: v })}>
                <SelectTrigger className={errors.centroComando ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione um centro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nenhum">Nenhum</SelectItem>
                  {centrosDeComandoDB.map((cc: any) => (
                    <SelectItem key={cc.id} value={String(cc.id)}>{cc.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.centroComando && <p className="text-xs text-destructive">{errors.centroComando}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="identificador" className={errors.identificador ? "text-destructive" : ""}>Identificador (Placa/Código) *</Label>
                <Input
                  id="identificador"
                  value={form.identificador}
                  onChange={(e) => setForm({ ...form, identificador: e.target.value })}
                  placeholder="Ex: ABC-1D23"
                  className={"mono " + (errors.identificador ? "border-destructive" : "")}
                />
                {errors.identificador && <p className="text-xs text-destructive">{errors.identificador}</p>}
              </div>
              {form.tipo === 'TERRESTRE' && (
                <div className="space-y-2">
                  <Label htmlFor="prefixo" className={errors.prefixo ? "text-destructive" : ""}>Prefixo *</Label>
                  <Input
                    id="prefixo"
                    value={form.prefixo}
                    onChange={(e) => setForm({ ...form, prefixo: e.target.value })}
                    placeholder="Ex: VTR-01"
                    className={"mono " + (errors.prefixo ? "border-destructive" : "")}
                  />
                  {errors.prefixo && <p className="text-xs text-destructive">{errors.prefixo}</p>}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modelo" className={errors.modelo ? "text-destructive" : ""}>Modelo *</Label>
                <Input
                  id="modelo"
                  value={form.modelo}
                  onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                  placeholder="Ex: Caminhão ABTR"
                  className={errors.modelo ? "border-destructive" : ""}
                />
                {errors.modelo && <p className="text-xs text-destructive">{errors.modelo}</p>}
              </div>
              <div className="space-y-2">
                <Label className={errors.contrato ? "text-destructive" : ""}>Contrato *</Label>
                <Select value={form.contrato} onValueChange={(v) => setForm({ ...form, contrato: v as Veiculo['contrato'] })}>
                  <SelectTrigger className={errors.contrato ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione um contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Próprio">Próprio</SelectItem>
                    <SelectItem value="Locado">Locado</SelectItem>
                    <SelectItem value="Órgão de Apoio">Órgão de Apoio</SelectItem>
                  </SelectContent>
                </Select>
                {errors.contrato && <p className="text-xs text-destructive">{errors.contrato}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fotoArquivo">Imagem do Veículo (Máx 10MB, JPG/PNG)</Label>
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
                          setForm({ ...form, fotoArquivo: null });
                          setRemoveExistingPhoto(true);
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
                          alert('A imagem deve ter no máximo 10MB.');
                          e.target.value = '';
                          return;
                        }
                        setForm({ ...form, fotoArquivo: file });
                        setPreviewUrl(URL.createObjectURL(file));
                        setRemoveExistingPhoto(false);
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {previewUrl ? 'Selecione outra imagem para substituir.' : 'Selecione uma imagem para o veículo.'}
                  </p>
                </div>
              </div>
            </div>
            
            {formError && (
              <div className="text-sm text-destructive mt-2">{formError}</div>
            )}

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-fire hover:bg-fire/90 text-white">
              {editingItem ? 'Salvar Alterações' : 'Criar Veículo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="glass-strong sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Visualizar Veículo</DialogTitle>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4">
              {viewingItem.fotoUrl && (
                <div className="w-full h-48 rounded-lg overflow-hidden border border-border">
                  <img src={viewingItem.fotoUrl} alt="Veículo" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Identificador</p>
                  <p className="font-medium">{viewingItem.identificador}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modelo</p>
                  <p className="font-medium">{viewingItem.modelo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prefixo</p>
                  <p className="font-medium">{(viewingItem.categoria || viewingItem.tipo) === 'TERRESTRE' ? (viewingItem.prefixo || '-') : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <div>{tipoBadge(viewingItem.categoria || viewingItem.tipo)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contrato</p>
                  <div>{contratoBadge(viewingItem.contrato || 'Próprio')}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Only Dialog */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-1 bg-black/90 border-none flex justify-center items-center">
          {imageModalUrl && (
             <img src={imageModalUrl} alt="Veículo Ampliado" className="max-w-full max-h-[85vh] object-contain rounded-md" />
          )}
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
