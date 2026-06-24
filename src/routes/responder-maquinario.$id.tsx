import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { ArrowLeft, Tractor, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RelatorioMaquinarioForm } from '@/components/fortivus/forms/RelatorioMaquinarioForm';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAttachmentWithAuth } from '@/lib/api';

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

  // ── 1. Fetch Attachments (if any) ──
  const { data: attachments, isLoading: isLoadingAttachments } = useQuery<any[]>({
    queryKey: ['attachments', despachoId],
    queryFn: async () => {
      const res = await fetchAttachmentWithAuth(`/api/v1/attachments/entity/00000000-0000-0000-0000-${idStr}`);
      if (res.status === 404) return [];
      if (!res.ok) throw new Error('Falha ao buscar anexos');
      return res.json();
    },
    retry: false
  });

  const relatorioComAnexos = {
    anexos: attachments?.filter((a: any) => a.entityType === 'RELATORIO_MAQUINARIO').map((a: any) => ({ url: a.url?.replace(/seaweedfs(:\d+)?/, window.location.hostname + '$1') })) || []
  };

  const handleFilesChange = (key: string, files: File[]) => {
    selectedFiles.current[key] = files;
  };

  const handleFileRemove = (url: string) => {
    deletedFiles.current.push(url);
  };

  const uploadFiles = async (files: File[], entityType: string) => {
    try {
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
    } catch (e) {
      console.error("Upload error:", e);
      throw e;
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
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
        {isLoadingAttachments ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-command" />
          </div>
        ) : (
          <RelatorioMaquinarioForm 
            initialData={relatorioComAnexos}
            onSubmit={handleSave} 
            onFilesChange={handleFilesChange}
            onFileRemove={handleFileRemove} 
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
