import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { ArrowLeft, Tractor, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RelatorioMaquinarioForm } from '@/components/fortivus/forms/RelatorioMaquinarioForm';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAttachmentWithAuth, fetchWithAuth } from '@/lib/api';

export const Route = createFileRoute('/responder-maquinario/$id')({
  component: ResponderMaquinarioPage,
});

function ResponderMaquinarioPage() {
  const { id } = Route.useParams();
  const despachoId = Number(id);
  const idStr = id.toString().padStart(12, '0');

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const selectedFiles = useRef<Record<string, File[]>>({ anexos: [] });
  const deletedFiles = useRef<string[]>([]);

  const { data: attachments, isLoading: isLoadingAttachments } = useQuery<any[]>({
    queryKey: ['attachments', despachoId],
    queryFn: async () => {
      try {
        return await fetchAttachmentWithAuth(`/api/v1/attachments/entity/00000000-0000-0000-0000-${idStr}`);
      } catch {
        return [];
      }
    },
    retry: false
  });

  const { data: relatorioData, isLoading: isLoadingRelatorio } = useQuery<any>({
    queryKey: ['relatorio-maquinario', despachoId],
    queryFn: async () => {
      try {
        return await fetchWithAuth(`/operacional/despachos/${despachoId}/relatorio-maquinario`);
      } catch (err: any) {
        if (err?.message?.includes('404') || err?.message?.includes('API Error: 404')) {
          return null;
        }
        throw err;
      }
    },
    retry: false
  });

  const { data: despachoData, isLoading: isLoadingDespacho } = useQuery<any>({
    queryKey: ['despacho', despachoId],
    queryFn: async () => {
      try {
        return await fetchWithAuth(`/operacional/despachos/${despachoId}`);
      } catch {
        return null;
      }
    }
  });

  const { data: osData } = useQuery<any>({
    queryKey: ['ordem-servico', despachoData?.ordemServicoId],
    queryFn: async () => {
      try {
        return await fetchWithAuth(`/operacional/os/${despachoData.ordemServicoId}`);
      } catch {
        return null;
      }
    },
    enabled: !!despachoData?.ordemServicoId
  });

  const { data: fireEventData, isLoading: isLoadingFireEvent } = useQuery<any>({
    queryKey: ['fireEvent', osData?.eventoFogoId],
    queryFn: async () => {
      if (!osData?.eventoFogoId) return null;
      try {
        const res = await fetch(`/api/v1/fire-events/buscar?q=${osData.eventoFogoId}`);
        const data = await res.json();
        return data && data.length > 0 ? data[0] : null;
      } catch (e: any) {
        return null;
      }
    },
    enabled: !!osData?.eventoFogoId,
    retry: false
  });

  const relatorioComAnexos = {
    ...relatorioData,
    anexos: attachments?.filter((a: any) => a.entityType === 'RELATORIO_MAQUINARIO').map((a: any) => ({ url: a.url?.replace(/seaweedfs(:\d+)?/, window.location.hostname + '$1') })) || []
  };

  const handleFilesChange = (key: string, files: File[]) => {
    selectedFiles.current[key] = files;
  };

  const handleFileRemove = (url: string) => {
    deletedFiles.current.push(url);
  };

  const uploadFiles = async (files: File[], entityType: string) => {
    const entityId = `00000000-0000-0000-0000-${idStr}`;
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityId', entityId);
      formData.append('entityType', entityType);
      await fetchAttachmentWithAuth(`/api/v1/attachments/upload`, {
        method: 'POST',
        body: formData
      });
    }
  };

  const handleSave = async (payload: any) => {
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      await fetchWithAuth(`/operacional/despachos/finalizar-maquinario`, {
        method: 'POST',
        body: JSON.stringify({ ...payload, despachoId }),
      });

      const allFiles = [...selectedFiles.current.anexos];
      if (allFiles.length > 0) {
        toast.info('Fazendo upload dos anexos...');
        await uploadFiles(allFiles, 'RELATORIO_MAQUINARIO');
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

      queryClient.invalidateQueries({ queryKey: ['attachments', despachoId] });
      queryClient.invalidateQueries({ queryKey: ['relatorio-maquinario', despachoId] });
      queryClient.invalidateQueries({ queryKey: ['despacho', despachoId] });
      toast.success('Relatório de Maquinário Finalizado', {
        description: 'Os dados e evidências foram enviados com sucesso.',
      });
      navigate({ to: '/despachos' });
    } catch (err) {
      console.error(err);
      toast.error('Erro no Envio', {
        description: 'Houve um problema ao salvar as informações ou realizar o upload das fotos.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoadingOsData = !!despachoData?.ordemServicoId && !osData;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link to="/despachos">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={isSubmitting}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tractor className="h-6 w-6 text-command" />
            Relatório de Maquinário
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Preenchimento de dados de atuação para o despacho #{id}
          </p>
        </div>
      </div>

      <div className="glass-strong rounded-xl border border-border p-4 sm:p-6">
        {(isLoadingAttachments || isLoadingRelatorio || isLoadingDespacho || isLoadingOsData || isLoadingFireEvent) ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-command" />
          </div>
        ) : (
          <RelatorioMaquinarioForm
            initialData={relatorioComAnexos}
            onSubmit={handleSave}
            onFilesChange={handleFilesChange}
            onFileRemove={handleFileRemove}
            eventoFogoId={osData?.eventoFogoId}
            despachoLat={despachoData?.latitude || osData?.latitude}
            despachoLng={despachoData?.longitude || osData?.longitude}
            fireEventLat={fireEventData?.latitude}
            fireEventLng={fireEventData?.longitude}
          />
        )}
      </div>

      <div className="flex flex-col items-end gap-3 pt-4 border-t border-border mt-6">
        {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
          <div className="w-full max-w-xs mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Enviando arquivos...</span>
              <span>{uploadProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5">
              <div className="bg-fire h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <Link to="/despachos">
            <Button variant="outline" type="button" disabled={isSubmitting}>Cancelar</Button>
          </Link>
          <Button
            type="submit"
            form="form-maquinario"
            className="bg-fire hover:bg-fire/90 text-white gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isSubmitting ? 'Finalizando...' : 'Finalizar Relatório'}
          </Button>
        </div>
      </div>
    </div>
  );
}
