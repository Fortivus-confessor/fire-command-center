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

function formatStatus(status: string) {
  switch (status) {
    case 'ABERTA': return 'Aberta';
    case 'EM_ANDAMENTO': return 'Em Andamento';
    case 'EM_EXECUCAO': return 'Em Execução';
    case 'CONCLUIDA': return 'Concluída';
    case 'CANCELADA': return 'Cancelada';
    case 'EM_DESLOCAMENTO': return 'Em Deslocamento';
    case 'EM_COMBATE': return 'Em Combate';
    case 'EM_RETORNO': return 'Em Retorno';
    default: return status || 'N/A';
  }
}

function statusBadge(s: string) {
  const display = formatStatus(s);
  switch (s) {
    case 'ABERTA': return <Badge variant="secondary">{display}</Badge>;
    case 'EM_ANDAMENTO':
    case 'EM_EXECUCAO': 
    case 'EM_DESLOCAMENTO':
    case 'EM_COMBATE':
    case 'EM_RETORNO':
      return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">{display}</Badge>;
    case 'CONCLUIDA': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">{display}</Badge>;
    case 'CANCELADA': return <Badge className="bg-red-500/10 text-red-500 border-red-500/30">{display}</Badge>;
    default: return <Badge variant="secondary">{display}</Badge>;
  }
}

function prioridadeBadge(p: string) {
  switch (p) {
    case 'P1': return <Badge className="bg-fire/20 text-fire border-fire/30">P1 - Extrema</Badge>;
    case 'P2': return <Badge className="bg-warning/20 text-warning border-warning/30">P2 - Alta</Badge>;
    case 'P3': return <Badge className="bg-command/20 text-command border-command/30">P3 - Média</Badge>;
    default: return <Badge variant="secondary">{p}</Badge>;
  }
}

function categoriaBadge(c: string) {
  switch(c) {
    case 'TERRESTRE': return <Badge className="bg-success/20 text-success border-success/30">Terrestre</Badge>;
    case 'AEREO': return <Badge className="bg-command/20 text-command border-command/30">Aéreo</Badge>;
    case 'MAQUINARIO': return <Badge className="bg-warning/20 text-warning border-warning/30">Maquinário</Badge>;
    default: return <Badge variant="secondary">{c || 'N/A'}</Badge>;
  }
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

  const { data: todosUsuarios = [] } = useQuery<any[]>({
    queryKey: ['usuarios'],
    queryFn: () => fetchWithAuth('/admin/usuarios')
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

  function openNewDespacho() {
    navigate({ to: `/ordens-servico/${id}/despacho/novo` as any });
  }

  function openEditDespacho(d: any) {
    navigate({ to: `/ordens-servico/${id}/despacho/${d.id}/editar` as any });
  }

  if (loadingOs || !os) {
    return <div className="p-8 text-center text-muted-foreground">Carregando dados da OS...</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 flex flex-col">
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
              {statusBadge(os.status)}
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Prioridade</span>
              {prioridadeBadge(os.prioridade || 'P2')}
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

      <div className="rounded-xl glass border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <Table>
              <TableHeader className="bg-secondary/40">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Escala / Equipe</TableHead>
              <TableHead>Responsável</TableHead>
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
                const responsavel = todosUsuarios.find(u => String(u.id) === String(d.responsavelId));
                return (
                  <TableRow key={d.id}>
                    <TableCell className="mono">D{d.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{esc?.equipeNome || 'Equipe Desconhecida'} - {esc?.comandanteNome || 'Comandante Desconhecido'}</div>
                    </TableCell>
                    <TableCell>{responsavel?.nome || 'Não Atribuído'}</TableCell>
                    <TableCell>{categoriaBadge(d.categoria)}</TableCell>
                    <TableCell>{statusBadge(d.status)}</TableCell>
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
        </div>
      </div>
    </div>
  );
}
