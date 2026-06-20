import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { ArrowLeft, Tractor, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RelatorioMaquinarioForm } from '@/components/fortivus/forms/RelatorioMaquinarioForm';
import { useState, useRef } from 'react';
import { uploadFilesToSeaweed } from '@/lib/upload';
import { toast } from 'sonner';

export const Route = createFileRoute('/responder-maquinario/$id')({
  component: ResponderMaquinarioPage,
});

function ResponderMaquinarioPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const selectedFiles = useRef<Record<string, File[]>>({ anexos: [] });

  const handleFilesChange = (key: string, files: File[]) => {
    selectedFiles.current[key] = files;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const allFiles = [...selectedFiles.current.anexos];
      
      if (allFiles.length > 0) {
        await uploadFilesToSeaweed(allFiles, id as string, 'RELATORIO_MAQUINARIO', (progress) => {
          setUploadProgress(progress);
        });
      }
      
      toast({
        title: 'Relatório Maquinário Finalizado',
        description: 'Os dados do relatório de maquinário e as evidências foram enviados com sucesso.',
      });
      navigate({ to: '/despachos' });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro no Envio',
        description: 'Houve um problema ao salvar as informações ou realizar o upload das fotos.',
        variant: 'destructive',
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
        <RelatorioMaquinarioForm onSubmit={handleSave} onFilesChange={handleFilesChange} />
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
