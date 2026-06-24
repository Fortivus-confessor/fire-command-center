import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { ArrowLeft, Truck, CheckCircle2, Loader2, Eye, Edit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RelatorioTerrestreForm, RelatorioTerrestrePayload } from '@/components/fortivus/forms/RelatorioTerrestreForm';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { fetchWithAuth, fetchAttachmentWithAuth } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/responder-terrestre/$id')({
  component: ResponderTerrestrePage,
});

// Sem pageMode, sempre será formulário direto
function ResponderTerrestrePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const despachoId = Number(id);

  const selectedFiles = useRef<Record<string, File[]>>({ origem: [], anexos: [] });
  const deletedFiles = useRef<string[]>([]);

  const handleFilesChange = (key: string, files: File[]) => {
    selectedFiles.current[key] = files;
  };

  // ── Busca o relatório existente (pode retornar 404) ──
  const { data: relatorioExistente, isLoading: isLoadingRelatorio } = useQuery<any>({
    queryKey: ['relatorio-terrestre', despachoId],
    queryFn: async () => {
      try {
        const data = await fetchWithAuth(`/operacional/despachos/${despachoId}/relatorio-terrestre`);
        return data;
      } catch (err: any) {
        if (err?.message?.includes('404') || err?.message?.includes('API Error: 404')) {
          return null; // sem relatório ainda
        }
        throw err;
      }
    },
    retry: false,
  });

  // ── Busca os dados do Despacho (para coords e OS associada) ──
  const { data: despachoData, isLoading: isLoadingDespacho } = useQuery<any>({
    queryKey: ['despacho', id],
    queryFn: async () => {
      try {
        return await fetchWithAuth(`/operacional/despachos/${id}`);
      } catch (err) {
        return null;
      }
    }
  });

  // ── Busca os dados da Ordem de Servico ──
  const { data: osData } = useQuery<any>({
    queryKey: ['ordem-servico', despachoData?.ordemServicoId],
    queryFn: async () => {
      try {
        return await fetchWithAuth(`/operacional/os/${despachoData.ordemServicoId}`);
      } catch (err) {
        return null;
      }
    },
    enabled: !!despachoData?.ordemServicoId
  });

  // ── Mutation para salvar/atualizar ──
  const mutation = useMutation({
    mutationFn: async (payload: RelatorioTerrestrePayload) => {
      return fetchWithAuth('/operacional/despachos/finalizar-terrestre', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relatorio-terrestre', despachoId] });
      queryClient.invalidateQueries({ queryKey: ['despacho', id] });
      queryClient.invalidateQueries({ queryKey: ['attachments', despachoId] });
      toast.success('Relatório Terrestre Salvo!', {
        description: 'O relatório foi registrado com sucesso. O despacho foi marcado como CONCLUÍDO.',
      });
      navigate({ to: '/despachos' });
    },
    onError: (err: any) => {
      console.error('Erro ao salvar relatório:', err);
      toast.error('Erro ao Salvar', {
        description: err?.message || 'Verifique os dados e tente novamente.',
      });
    },
  });

  const handleSubmit = async (payload: RelatorioTerrestrePayload) => {
    const uploadFiles = async (files: File[], entityType: string) => {
      // Cria um fake UUID a partir do despachoId
      const idStr = String(despachoId).padStart(12, '0').slice(-12);
      const entityIdUuid = `00000000-0000-0000-0000-${idStr}`;

      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('entityId', entityIdUuid);
          formData.append('entityType', entityType);

          await fetchAttachmentWithAuth(`/api/v1/attachments/upload`, {
            method: 'POST',
            body: formData
          });
        } catch (e) {
          console.error("Falha ao subir arquivo", file.name, e);
          toast.error(`Falha ao anexar ${file.name}`);
        }
      }
    };

    if (selectedFiles.current.origem && selectedFiles.current.origem.length > 0) {
      toast.info('Fazendo upload da imagem de origem...');
      await uploadFiles(selectedFiles.current.origem, 'ORIGEM_INCENDIO');
    }
    if (selectedFiles.current.anexos && selectedFiles.current.anexos.length > 0) {
      toast.info('Fazendo upload dos anexos...');
      await uploadFiles(selectedFiles.current.anexos, 'RELATORIO_TERRESTRE');
    }

    if (deletedFiles.current && deletedFiles.current.length > 0) {
      toast.info('Aplicando exclusões de anexos...');
      for (const urlToRemove of deletedFiles.current) {
        if (!attachments) continue;
        const attachment = attachments.find((a: any) => {
          try {
            const aPath = new URL(a.url).pathname;
            const urlPath = new URL(urlToRemove).pathname;
            return aPath === urlPath;
          } catch {
            const originalUrl = a.url;
            const replacedUrl = originalUrl?.replace(/seaweedfs(:\d+)?/, window.location.hostname + '$1');
            return replacedUrl === urlToRemove || originalUrl === urlToRemove;
          }
        });
        if (attachment) {
          try {
            await fetchAttachmentWithAuth(`/api/v1/attachments/${attachment.id}`, { method: 'DELETE' });
          } catch (e) {
            console.error("Falha ao remover arquivo", e);
          }
        }
      }
    }

    await mutation.mutateAsync(payload);
  };

  const handleFileRemove = (url: string) => {
    deletedFiles.current.push(url);
  };

  // ── Determina o status ──
  const hasRelatorio = !!relatorioExistente;

  // ── Busca os anexos do attachment-service ──
  const { data: attachments, isLoading: isLoadingAttachments } = useQuery<any[]>({
    queryKey: ['attachments', despachoId],
    queryFn: async () => {
      const idStr = String(despachoId).padStart(12, '0').slice(-12);
      const entityIdUuid = `00000000-0000-0000-0000-${idStr}`;
      try {
        return await fetchAttachmentWithAuth(`/api/v1/attachments/entity/${entityIdUuid}`);
      } catch (err) {
        console.error('Erro ao buscar anexos', err);
        return [];
      }
    },
    enabled: hasRelatorio,
    retry: false
  });

  const relatorioComAnexos = relatorioExistente ? {
    ...relatorioExistente,
    anexos: attachments?.filter((a: any) => a.entityType === 'RELATORIO_TERRESTRE').map((a: any) => ({ url: a.url?.replace(/seaweedfs(:\d+)?/, window.location.hostname + '$1') })) || [],
    origem: attachments?.filter((a: any) => a.entityType === 'ORIGEM_INCENDIO').map((a: any) => ({ url: a.url?.replace(/seaweedfs(:\d+)?/, window.location.hostname + '$1') })) || []
  } : null;

  // Se está carregando, mostra spinner
  const isLoadingOsData = !!despachoData?.ordemServicoId && !osData;
  if (isLoadingRelatorio || (hasRelatorio && isLoadingAttachments) || isLoadingDespacho || isLoadingOsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Carregando dados e anexos...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link to="/despachos">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={mutation.isPending}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-command" />
            Relatório de Combate Terrestre
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            Despacho #{id}
            {hasRelatorio && (
              <span className="ml-2">
                <Badge variant="default" className="bg-success/20 text-success border-success/30 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Relatório Registrado
                </Badge>
              </span>
            )}
          </div>
          {hasRelatorio && relatorioExistente?.dataFim && (
            <p className="text-xs text-muted-foreground mt-1">
              Respondido em {format(new Date(relatorioExistente.dataFim), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          )}
        </div>
      </div>

      <div className="glass-strong rounded-xl border border-command/30 p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-command/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-command" />
            </div>
            <div>
              <h2 className="font-semibold">{hasRelatorio ? 'Editando Relatório' : 'Preencher Relatório'}</h2>
              <p className="text-sm text-muted-foreground">
                {hasRelatorio ? 'Alterações sobrescrevem o relatório existente.' : 'Este despacho ainda não possui relatório de resposta.'}
              </p>
            </div>
          </div>
        </div>
        <RelatorioTerrestreForm
          despachoId={despachoId}
          initialData={relatorioComAnexos}
          onSubmit={handleSubmit}
          onFilesChange={handleFilesChange}
          onFileRemove={handleFileRemove}
          despachoLat={despachoData?.latitude}
          despachoLng={despachoData?.longitude}
          eventoFogoId={osData?.eventoFogoId}
        />
      </div>

      <div className="flex flex-col items-end gap-3 pt-4 border-t border-border mt-6">
        {mutation.isPending && (
          <div className="w-full max-w-xs mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Salvando relatório...</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5">
              <div className="bg-fire h-1.5 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <Button
            variant="outline"
            type="button"
            disabled={mutation.isPending}
            onClick={() => navigate({ to: '/despachos' })}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-terrestre"
            className="bg-fire hover:bg-fire/90 text-white gap-2"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Salvando...' : (hasRelatorio ? 'Salvar Alterações' : 'Finalizar Relatório')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatResultado(valor: string): string {
  const map: Record<string, string> = {
    EM_ANDAMENTO: 'Em andamento',
    NECESSIDADE_FISCALIZACAO: 'Necessidade de fiscalização',
    SEM_INTERVENCAO: 'Sem intervenção necessária',
    EXTINTO_RESOLVIDA: 'Extinto / Resolvida',
    DESPACHO_INCORRETO: 'Despacho incorreto',
    OUTRO: 'Outro',
  };
  return map[valor] ?? valor;
}
