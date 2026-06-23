import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft, FileText, Plus, Truck, Pencil, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export const Route = createFileRoute('/ordens-servico_/$id')({
  component: OrdemServicoDetalhePage,
});

function formatOsId(id: string | number) {
  return `OS2026${String(id).padStart(8, '0')}`;
}

function formatDateBR(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function OrdemServicoDetalhePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: os, isLoading: loadingOs } = useQuery<any>({
    queryKey: ['os', id],
    queryFn: () => fetchWithAuth(`/operacional/os/${id}`)
  });

  const { data: despachosDB = [] } = useQuery<any[]>({
    queryKey: ['despachos'],
    queryFn: () => fetchWithAuth('/operacional/despachos')
  });

  const { data: todasEscalas = [] } = useQuery<any[]>({
    queryKey: ['escalas'],
    queryFn: () => fetchWithAuth('/operacional/escalas')
  });

  const { data: todasEquipes = [] } = useQuery<any[]>({
    queryKey: ['equipes'],
    queryFn: () => fetchWithAuth('/admin/equipes')
  });

  const { data: centrosDeComandoDB = [] } = useQuery<any[]>({
    queryKey: ['centros-comando'],
    queryFn: () => fetchWithAuth('/admin/centros'),
  });

  const { data: usuariosDB = [] } = useQuery<any[]>({
    queryKey: ['usuarios'],
    queryFn: () => fetchWithAuth('/admin/usuarios'),
  });

  const despachos = despachosDB.filter(d => String(d.ordemServicoId) === String(id));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDespacho, setEditingDespacho] = useState<any>(null);
  
  const [form, setForm] = useState({
    escalaId: '',
    descricaoTarefa: '',
    lat: '',
    lng: ''
  });

  const saveMutation = useMutation({
    mutationFn: (payload: any) => fetchWithAuth('/operacional/despachos', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despachos'] });
      setDialogOpen(false);
      toast.success(editingDespacho ? 'Despacho atualizado!' : 'Despacho criado com sucesso!');
    },
    onError: () => toast.error('Erro ao salvar despacho.')
  });

  function openNewDespacho() {
    setEditingDespacho(null);
    setForm({
      escalaId: '',
      descricaoTarefa: '',
      lat: os?.latitude ? String(os.latitude) : '',
      lng: os?.longitude ? String(os.longitude) : ''
    });
    setDialogOpen(true);
  }

  function openEditDespacho(d: any) {
    setEditingDespacho(d);
    setForm({
      escalaId: String(d.escalaId || ''),
      descricaoTarefa: d.descricaoTarefa || '',
      lat: d.latitude ? String(d.latitude) : '',
      lng: d.longitude ? String(d.longitude) : ''
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.escalaId) {
      toast.error('Selecione uma escala');
      return;
    }
    const payload = {
      id: editingDespacho?.id || undefined,
      ordemServicoId: Number(id),
      escalaId: form.escalaId,
      descricaoTarefa: form.descricaoTarefa,
      latitude: form.lat ? parseFloat(form.lat) : null,
      longitude: form.lng ? parseFloat(form.lng) : null
    };
    saveMutation.mutate(payload);
  }

  if (loadingOs || !os) {
    return <div className="p-8 text-center text-muted-foreground">Carregando dados da OS...</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: '/ordens-servico' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-fire" />
            Detalhes da Ordem de Serviço
          </h1>
          <p className="text-sm text-muted-foreground mono mt-1">
            {formatOsId(os.id)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass border border-border p-5 rounded-xl space-y-4">
          <h3 className="font-semibold text-lg border-b border-border pb-2">Informações Gerais</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block mb-1">Status</span>
              <Badge variant="outline">{os.status}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Prioridade</span>
              <Badge variant="secondary">{os.prioridade}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Tipo Despacho</span>
              <span className="font-medium">{os.tipoDespacho || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Evento de Fogo ID</span>
              <span className="font-medium mono">{os.eventoFogoId || 'Não vinculado'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground block mb-1">Diretrizes da Missão</span>
              <p className="bg-secondary/30 p-3 rounded-md text-sm">{os.descricaoTarefa || 'Sem descrição.'}</p>
            </div>
          </div>
        </div>

        <div className="glass border border-border p-5 rounded-xl space-y-4">
          <h3 className="font-semibold text-lg border-b border-border pb-2">Localização & Datas</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block mb-1">Criada em</span>
              <span className="font-medium">{formatDateBR(os.dataCriacao)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Data Final</span>
              <span className="font-medium">{formatDateBR(os.dataFim)}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground block mb-1">Coordenadas (Lat, Lng)</span>
              <div className="flex items-center gap-2 font-mono bg-secondary/30 p-2 rounded-md">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {os.latitude && os.longitude ? `${os.latitude}, ${os.longitude}` : 'Não informado'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Truck className="h-5 w-5 text-warning" />
          Despachos Relacionados
        </h2>
        <Button onClick={openNewDespacho} size="lg" className="bg-fire hover:bg-fire/90 text-white font-semibold">
          <Plus className="h-5 w-5 mr-2" />
          Adicionar Despacho
        </Button>
      </div>

      <div className="rounded-xl overflow-hidden glass border border-border">
        <Table>
          <TableHeader className="bg-secondary/40">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Escala / Equipe</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {despachos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum despacho vinculado a esta OS.
                </TableCell>
              </TableRow>
            ) : (
              despachos.map(d => {
                const esc = todasEscalas.find(e => String(e.id) === String(d.escalaId));
                const eq = todasEquipes.find(e => String(e.id) === String(esc?.equipeId));
                return (
                  <TableRow key={d.id}>
                    <TableCell className="mono">{d.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{eq?.nome || 'Equipe Desconhecida'}</div>
                      <div className="text-xs text-muted-foreground">Escala ID: {d.escalaId}</div>
                    </TableCell>
                    <TableCell>{d.categoria || 'N/A'}</TableCell>
                    <TableCell><Badge variant="outline">{d.status}</Badge></TableCell>
                    <TableCell>{formatDateBR(d.dataInicio)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditDespacho(d)} className="hover:text-command">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>{editingDespacho ? 'Editar Despacho' : 'Novo Despacho'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Escala Responsável *</Label>
              <Select value={form.escalaId} onValueChange={(v) => setForm({ ...form, escalaId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a escala" />
                </SelectTrigger>
                <SelectContent>
                  {todasEscalas.map(e => {
                    const eq = todasEquipes.find(eq => eq.id === e.equipeId);
                    return <SelectItem key={e.id} value={String(e.id)}>{eq?.nome || 'Desconhecida'} (ID: {e.id})</SelectItem>
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Diretrizes / Descrição</Label>
              <Textarea 
                placeholder="Detalhes específicos para este despacho..."
                value={form.descricaoTarefa}
                onChange={e => setForm({...form, descricaoTarefa: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input value={form.lat} onChange={e => setForm({...form, lat: e.target.value})} placeholder="-15.000" />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input value={form.lng} onChange={e => setForm({...form, lng: e.target.value})} placeholder="-50.000" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-fire hover:bg-fire/90 text-white">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
