import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, ArrowLeft, FileText, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api';
import SituationMapClient from '../components/fortivus/map/SituationMapClient';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export const Route = createFileRoute('/ordens-servico_/nova')({
  component: NovaOrdemServicoPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      eventoFogoId: search.eventoFogoId as string | undefined,
    }
  }
});

const emptyForm = {
  comando: '',
  equipe: '',
  tipoDespacho: '',
  prioridade: 'P2',
  responsavel: '',
  descricao: '',
  latLng: '',
  eventoFogoId: '',
};

function NovaOrdemServicoPage() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const eventoFogoId = searchParams.eventoFogoId;
  const [form, setForm] = useState({ ...emptyForm, eventoFogoId: eventoFogoId || '' });

  const { data: centrosDeComandoDB = [] } = useQuery<any[]>({
    queryKey: ['centros-comando'],
    queryFn: () => fetchWithAuth('/admin/centros'),
  });

  const { data: usuariosDB = [] } = useQuery<any[]>({
    queryKey: ['usuarios'],
    queryFn: () => fetchWithAuth('/admin/usuarios'),
  });

  const { data: escalasAtivas = [] } = useQuery<any[]>({
    queryKey: ['escalas-ativas', form.comando],
    queryFn: () => fetchWithAuth(`/operacional/escalas/centro/${form.comando}/ativas`),
    enabled: !!form.comando,
  });

  const { data: todasEscalas = [] } = useQuery<any[]>({
    queryKey: ['escalas'],
    queryFn: () => fetchWithAuth('/operacional/escalas')
  });

  async function save() {
    try {
      if (!form.tipoDespacho || !form.comando || !form.equipe || !form.responsavel) {
         toast.error("Preencha todos os campos obrigatórios");
         return;
      }
      const p = {
        escalaId: form.equipe,
        tipoDespacho: form.tipoDespacho,
        descricaoTarefa: form.descricao,
        relatorId: form.responsavel,
        localizacao: form.latLng ? `POINT(${form.latLng.split(',')[1].trim()} ${form.latLng.split(',')[0].trim()})` : null,
        localizacaoTexto: form.latLng,
        eventoFogoId: form.eventoFogoId || null,
      };

      const res = await fetchWithAuth('/operacional/despachos', {
        method: 'POST',
        body: JSON.stringify(p),
      });
      if (res && res.id) {
        toast.success("Despacho e OS criados com sucesso!");
        navigate({ to: '/ordens-servico' });
      } else {
        toast.error("Erro ao criar OS.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Ocorreu um erro inesperado.");
    }
  }

  function handleMapClick(lat: number, lng: number) {
    setForm({ ...form, latLng: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: '/ordens-servico' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-fire" />
            Cadastrar OS para evento de fogo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione a equipe, defina as diretrizes e despache a Ordem de Serviço.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[500px]">
        {/* Left Side: Map */}
        <div className="rounded-xl overflow-hidden glass border border-border flex flex-col relative h-[500px] lg:h-auto">
          <SituationMapClient 
             selectedId={eventoFogoId} 
             isolatedEventId={eventoFogoId}
             onClickMap={handleMapClick}
             activePin={form.latLng ? { lat: parseFloat(form.latLng.split(',')[0]), lng: parseFloat(form.latLng.split(',')[1]) } : null}
          />
        </div>

        {/* Right Side: Form */}
        <div className="rounded-xl glass border border-border p-6 overflow-y-auto">
          <div className="grid gap-5">
            {eventoFogoId && (
              <div className="space-y-2">
                <Label>ID do Evento de Fogo</Label>
                <div className="px-3 py-2 bg-secondary/50 rounded-md border border-border mono text-sm text-muted-foreground break-all">
                  {eventoFogoId}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Despacho *</Label>
                <Select value={form.tipoDespacho} onValueChange={(v) => setForm({ ...form, tipoDespacho: v as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Combate Incêndio Terrestre">Combate Incêndio Terrestre</SelectItem>
                    <SelectItem value="Combate Incêndio Aéreo">Combate Incêndio Aéreo</SelectItem>
                    <SelectItem value="Combate Incêndio Maquinário">Combate Incêndio Maquinário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade *</Label>
                <Select value={form.prioridade} onValueChange={(v: any) => setForm({ ...form, prioridade: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P1">P1 - Imediata</SelectItem>
                    <SelectItem value="P2">P2 - Alta</SelectItem>
                    <SelectItem value="P3">P3 - Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Comando (Centro) *</Label>
                <Select value={form.comando || ''} onValueChange={(v) => setForm({ ...form, comando: v, equipe: '', responsavel: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o comando" />
                  </SelectTrigger>
                  <SelectContent>
                    {centrosDeComandoDB.map((cc: any) => <SelectItem key={cc.id} value={String(cc.id)}>{cc.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Equipe *</Label>
                <Select disabled={!form.comando} value={form.equipe || ''} onValueChange={(v) => setForm({ ...form, equipe: v, responsavel: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a escala/equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {escalasAtivas.map((eq: any) => {
                      return <SelectItem key={eq.id} value={String(eq.id)}>{eq.equipeNome} - {eq.comandanteNome || 'Sem Cmt'}</SelectItem>
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Usuário Responsável *</Label>
              <Select disabled={!form.equipe} value={form.responsavel || ''} onValueChange={(v) => setForm({ ...form, responsavel: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {usuariosDB.filter((u: any) => {
                    const selectedScale = todasEscalas.find((e: any) => String(e.id) === String(form.equipe));
                    if (!selectedScale) return false;
                    const ids = [...(selectedScale.integranteIds || []), selectedScale.comandanteId].map(String);
                    return ids.includes(String(u.id));
                  }).map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ponto de Encontro / Local (Clique no mapa)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="-15.000, -50.000"
                  value={form.latLng}
                  onChange={(e) => setForm({ ...form, latLng: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Diretrizes da Missão</Label>
              <Textarea 
                placeholder="Descreva as instruções operacionais para a equipe..." 
                className="resize-none h-24"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            
            <div className="pt-4 flex justify-end gap-3 border-t border-border">
              <Button variant="outline" onClick={() => navigate({ to: '/ordens-servico' })}>
                Cancelar
              </Button>
              <Button onClick={save} className="bg-fire hover:bg-fire/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Confirmar Despacho
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
