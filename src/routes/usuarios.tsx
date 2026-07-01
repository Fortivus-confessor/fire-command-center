import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  UserCog,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/usuarios")({
  component: UsuariosPage,
});

type UserRole =
  | "ROLE_ADMIN"
  | "ROLE_CENTRO_COMANDO_CENTRAL"
  | "ROLE_CENTRO_COMANDO"
  | "ROLE_COMBATENTE";

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
  senha?: string;
  confirmarSenha?: string;
  fotoUrl?: string | null;
  fotoArquivo?: File | null;
}

interface CentroComandoDTO {
  id: string;
  nome: string;
}

const emptyForm: UsuarioDTO = {
  nome: "",
  email: "",
  cpf: "",
  perfil: "ROLE_COMBATENTE",
  estadoOperacional: "DISPONIVEL",
  centroComandoId: "",
  rg: "",
  matricula: "",
  dataNascimento: "",
  tipoSanguineo: "",
  senha: "",
  confirmarSenha: "",
  fotoArquivo: null,
};

const roleLabels: Record<string, string> = {
  ROLE_ADMIN: "Administrador",
  ROLE_CENTRO_COMANDO_CENTRAL: "Centro de Comando Central",
  ROLE_CENTRO_COMANDO: "Centro de Comando",
  ROLE_COMBATENTE: "Combatente",
};

function roleBadge(r: string) {
  switch (r) {
    case "ROLE_ADMIN":
      return <Badge className="bg-fire/20 text-fire border-fire/30">{roleLabels[r]}</Badge>;
    case "ROLE_CENTRO_COMANDO_CENTRAL":
      return (
        <Badge className="bg-command/20 text-command border-command/30">{roleLabels[r]}</Badge>
      );
    case "ROLE_CENTRO_COMANDO":
      return (
        <Badge className="bg-warning/20 text-warning border-warning/30">{roleLabels[r]}</Badge>
      );
    case "ROLE_COMBATENTE":
      return (
        <Badge className="bg-success/20 text-success border-success/30">{roleLabels[r]}</Badge>
      );
    default:
      return <Badge variant="secondary">{r}</Badge>;
  }
}

function statusBadge(s: string) {
  switch (s) {
    case "DISPONIVEL":
      return <Badge className="bg-success/20 text-success border-success/30">Disponível</Badge>;
    case "EM_MISSAO":
      return <Badge className="bg-fire/20 text-fire border-fire/30">Em Missão</Badge>;
    case "FOLGA":
      return <Badge className="bg-info/20 text-info border-info/30">Folga</Badge>;
    case "FERIAS":
      return <Badge className="bg-command/20 text-command border-command/30">Férias</Badge>;
    case "AFASTADO":
      return (
        <Badge className="bg-destructive/20 text-destructive border-destructive/30">Afastado</Badge>
      );
    default:
      return <Badge variant="secondary">{s}</Badge>;
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
    queryKey: ["usuarios", pageIndex, pageSize],
    queryFn: () => fetchWithAuth(`/admin/usuarios/paged?page=${pageIndex}&size=${pageSize}`),
  });

  const usuarios = pageData?.content || [];

  const { data: centros = [] } = useQuery<CentroComandoDTO[]>({
    queryKey: ["centros-comando"],
    queryFn: () => fetchWithAuth("/admin/centros"),
  });

  const [viewingItem, setViewingItem] = useState<UsuarioDTO | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const mutationCreateEdit = useMutation({
    mutationFn: (usuario: UsuarioDTO) => {
      const formData = new FormData();
      if (usuario.id) formData.append("id", usuario.id);
      formData.append("nome", usuario.nome);
      formData.append("email", usuario.email);
      formData.append("cpf", usuario.cpf);
      formData.append("perfil", usuario.perfil);
      formData.append("estadoOperacional", usuario.estadoOperacional);
      if (usuario.centroComandoId && usuario.centroComandoId !== "none") {
        formData.append("centroComandoId", usuario.centroComandoId);
      }
      if (usuario.rg) formData.append("rg", usuario.rg);
      if (usuario.matricula) formData.append("matricula", usuario.matricula);
      if (usuario.dataNascimento) formData.append("dataNascimento", usuario.dataNascimento);
      if (usuario.tipoSanguineo) formData.append("tipoSanguineo", usuario.tipoSanguineo);
      if (usuario.senha && !usuario.id) formData.append("senha", usuario.senha); // Backend only uses password for creation

      if (usuario.fotoArquivo) {
        formData.append("fotoArquivo", usuario.fotoArquivo);
      } else if (usuario.fotoUrl === null && editingItem?.fotoUrl) {
        // Indicador para o backend remover a foto
        formData.append("removerFoto", "true");
      }

      return fetchWithAuth("/admin/usuarios", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setDialogOpen(false);
    },
  });

  const mutationDelete = useMutation({
    mutationFn: (id: string) => fetchWithAuth(`/admin/usuarios/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
  });

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UsuarioDTO | null>(null);
  const [form, setForm] = useState<UsuarioDTO>(emptyForm);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = usuarios.filter((item: UsuarioDTO) => {
    const matchSearch =
      !search ||
      item.nome?.toLowerCase().includes(search.toLowerCase()) ||
      item.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || item.perfil === filterRole;
    return matchSearch && matchRole;
  });

  function openNew() {
    setEditingItem(null);
    setForm({ ...emptyForm });
    setPhotoPreview(null);
    setFormError(null);
    setShowPassword(false);
    setDialogOpen(true);
  }

  function openEdit(item: UsuarioDTO) {
    setEditingItem(item);
    setForm({
      id: item.id,
      nome: item.nome,
      email: item.email,
      cpf: item.cpf,
      perfil: item.perfil,
      estadoOperacional: item.estadoOperacional,
      centroComandoId: item.centroComandoId || "none",
      rg: item.rg || "",
      matricula: item.matricula || "",
      dataNascimento: item.dataNascimento || "",
      tipoSanguineo: item.tipoSanguineo || "",
      fotoUrl: item.fotoUrl || null,
      senha: "", // Don't load password
      confirmarSenha: "",
      fotoArquivo: null,
    });
    setPhotoPreview(item.fotoUrl || null);
    setFormError(null);
    setShowPassword(false);
    setDialogOpen(true);
  }

  function openView(item: UsuarioDTO) {
    setViewingItem(item);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, fotoArquivo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function removePhoto() {
    setForm({ ...form, fotoArquivo: null, fotoUrl: null });
    setPhotoPreview(null);
  }

  function handleSave() {
    if (
      !form.nome ||
      !form.email ||
      !form.cpf ||
      !form.perfil ||
      !form.estadoOperacional ||
      form.centroComandoId === "none" ||
      form.centroComandoId === ""
    ) {
      setFormError("Preencha todos os campos obrigatórios (marcados com *).");
      return;
    }
    if (!editingItem && (!form.senha || form.senha !== form.confirmarSenha)) {
      setFormError("As senhas não coincidem ou estão vazias.");
      return;
    }
    setFormError(null);
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
          <p className="text-sm text-muted-foreground mt-1">Gerencie os usuários do sistema</p>
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
                filtered.map((item: UsuarioDTO) => (
                  <TableRow key={item.id} className="hover:bg-secondary/20 transition">
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.email}</TableCell>
                    <TableCell className="mono text-muted-foreground">
                      {maskCpf(item.cpf)}
                    </TableCell>
                    <TableCell>{roleBadge(item.perfil)}</TableCell>
                    <TableCell className="text-sm">
                      {centros.find((c) => c.id === item.centroComandoId)?.nome || "-"}
                    </TableCell>
                    <TableCell>{statusBadge(item.estadoOperacional)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openView(item)}
                          className="h-8 w-8 hover:text-primary"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(item)}
                          className="h-8 w-8 hover:text-command"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(item.id!)}
                          className="h-8 w-8 hover:text-destructive"
                          title="Excluir"
                        >
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
              Página {pageData.number + 1} de {pageData.totalPages} (Mostrando {filtered.length} de{" "}
              {pageData.totalElements})
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageData.first}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((p) => p + 1)}
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
            <DialogTitle>{editingItem ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Atualize os dados do usuário."
                : "Preencha os dados para cadastrar um novo usuário."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Foto Profile */}
            <div className="flex flex-col items-center gap-3 mb-2">
              <div className="relative h-24 w-24 rounded-full border-2 border-dashed border-border overflow-hidden bg-secondary/30 flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
                {photoPreview && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full"
                    onClick={removePhoto}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="fotoArquivo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <Label
                  htmlFor="fotoArquivo"
                  className="cursor-pointer bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                >
                  {photoPreview ? "Trocar Foto" : "Adicionar Foto"}
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome do usuário"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@fortivus.gov.br"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={form.rg}
                  onChange={(e) => setForm({ ...form, rg: e.target.value })}
                  placeholder="000000"
                  className="mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  value={form.matricula}
                  onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                  placeholder="00000"
                  className="mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de Nasc.</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={form.dataNascimento}
                  onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
                  className="mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo Sanguíneo</Label>
                <Select
                  value={form.tipoSanguineo}
                  onValueChange={(v) => setForm({ ...form, tipoSanguineo: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A_POSITIVO">A+</SelectItem>
                    <SelectItem value="A_NEGATIVO">A-</SelectItem>
                    <SelectItem value="B_POSITIVO">B+</SelectItem>
                    <SelectItem value="B_NEGATIVO">B-</SelectItem>
                    <SelectItem value="AB_POSITIVO">AB+</SelectItem>
                    <SelectItem value="AB_NEGATIVO">AB-</SelectItem>
                    <SelectItem value="O_POSITIVO">O+</SelectItem>
                    <SelectItem value="O_NEGATIVO">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={form.perfil} onValueChange={(v) => setForm({ ...form, perfil: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROLE_ADMIN">Administrador</SelectItem>
                    <SelectItem value="ROLE_CENTRO_COMANDO_CENTRAL">
                      Centro de Comando Central
                    </SelectItem>
                    <SelectItem value="ROLE_CENTRO_COMANDO">Centro de Comando</SelectItem>
                    <SelectItem value="ROLE_COMBATENTE">Combatente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado Operacional *</Label>
                <Select
                  value={form.estadoOperacional}
                  onValueChange={(v) => setForm({ ...form, estadoOperacional: v })}
                >
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
              <div className="space-y-2">
                <Label>Centro de Comando *</Label>
                <Select
                  value={form.centroComandoId}
                  onValueChange={(v) => setForm({ ...form, centroComandoId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {centros.map((cc) => (
                      <SelectItem key={cc.id} value={cc.id}>
                        {cc.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Senha - Apenas para criação */}
            {!editingItem && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="senha">Senha *</Label>
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    placeholder="******"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-7 h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                  <Input
                    id="confirmarSenha"
                    type={showPassword ? "text" : "password"}
                    value={form.confirmarSenha}
                    onChange={(e) => setForm({ ...form, confirmarSenha: e.target.value })}
                    placeholder="******"
                  />
                </div>
              </div>
            )}

            {formError && <div className="text-sm text-destructive mt-2">{formError}</div>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={mutationCreateEdit.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-fire hover:bg-fire/90 text-white"
              disabled={mutationCreateEdit.isPending}
            >
              {mutationCreateEdit.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingItem ? (
                "Salvar Alterações"
              ) : (
                "Criar Usuário"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewingItem !== null} onOpenChange={(open) => !open && setViewingItem(null)}>
        <DialogContent className="glass-strong sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Visualizar Usuário</DialogTitle>
          </DialogHeader>
          {viewingItem && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-4">
                {viewingItem.fotoUrl ? (
                  <img
                    src={viewingItem.fotoUrl}
                    alt="Foto"
                    className="h-20 w-20 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{viewingItem.nome}</h3>
                  <p className="text-muted-foreground">{viewingItem.email}</p>
                  <div className="flex gap-2 mt-2">
                    {roleBadge(viewingItem.perfil)}
                    {statusBadge(viewingItem.estadoOperacional)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm bg-secondary/20 p-4 rounded-lg">
                <div>
                  <span className="text-muted-foreground block mb-1">CPF</span>
                  <span className="mono font-medium">{viewingItem.cpf || "-"}</span>
                </div>
                {viewingItem.rg && (
                  <div>
                    <span className="text-muted-foreground block mb-1">RG</span>
                    <span className="mono font-medium">{viewingItem.rg}</span>
                  </div>
                )}
                {viewingItem.matricula && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Matrícula</span>
                    <span className="mono font-medium">{viewingItem.matricula}</span>
                  </div>
                )}
                {viewingItem.dataNascimento && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Data Nasc.</span>
                    <span className="mono font-medium">
                      {new Date(viewingItem.dataNascimento).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                )}
                {viewingItem.tipoSanguineo && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Tipo Sanguíneo</span>
                    <span className="font-medium">
                      {viewingItem.tipoSanguineo
                        .replace("_POSITIVO", "+")
                        .replace("_NEGATIVO", "-")}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground block mb-1">Centro de Comando</span>
                  <span className="font-medium">
                    {centros.find((c) => c.id === viewingItem.centroComandoId)?.nome || "-"}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingItem(null)}>
              Fechar
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
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={mutationDelete.isPending}
            >
              {mutationDelete.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
