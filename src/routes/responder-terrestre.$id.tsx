import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { ArrowLeft, Truck, CheckCircle2, Loader2, Eye, Edit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RelatorioTerrestreForm, RelatorioTerrestrePayload } from '@/components/fortivus/forms/RelatorioTerrestreForm';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/responder-terrestre/$id')({
  component: ResponderTerrestrePage,
});

type PageMode = 'view-status' | 'form-new' | 'form-edit' | 'form-readonly';

function ResponderTerrestrePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const despachoId = Number(id);

  const [mode, setMode] = useState<PageMode>('view-status');
  const selectedFiles = useRef<Record<string, File[]>>({ origem: [], anexos: [] });

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
      toast.success('Relatório Terrestre Salvo!', {
        description: 'O relatório foi registrado com sucesso. O despacho foi marcado como CONCLUÍDO.',
      });
      setMode('view-status');
    },
    onError: (err: any) => {
      console.error('Erro ao salvar relatório:', err);
      toast.error('Erro ao Salvar', {
        description: err?.message || 'Verifique os dados e tente novamente.',
      });
    },
  });

  const handleSubmit = async (payload: RelatorioTerrestrePayload) => {
    await mutation.mutateAsync(payload);
  };

  // ── Determina o modo inicial após carregar ──
  const hasRelatorio = relatorioExistente !== null && relatorioExistente !== undefined;

  // Se está carregando, mostra spinner
  if (isLoadingRelatorio) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Verificando relatório...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 pb-20">
      {/* ── Cabeçalho ── */}
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
          <p className="text-sm text-muted-foreground mt-1">
            Despacho #{id}
            {hasRelatorio && (
              <span className="ml-2">
                <Badge variant="default" className="bg-success/20 text-success border-success/30 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Relatório Registrado
                </Badge>
              </span>
            )}
          </p>
          {hasRelatorio && relatorioExistente?.dataFim && (
            <p className="text-xs text-muted-foreground mt-1">
              Respondido em {format(new Date(relatorioExistente.dataFim), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          )}
        </div>
      </div>

      {/* ── Painel de Status (relatório já existe, nenhum modo de form ativo) ── */}
      {hasRelatorio && (mode === 'view-status') && (
        <div className="glass-strong rounded-xl border border-success/30 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Relatório já foi preenchido</h2>
              <p className="text-sm text-muted-foreground">
                Este despacho já possui um relatório de resposta terrestre registrado.
              </p>
            </div>
          </div>

          {/* Resumo rápido */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {relatorioExistente?.resultadoOcorrencia && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Resultado</p>
                <p className="font-medium">{formatResultado(relatorioExistente.resultadoOcorrencia)}</p>
              </div>
            )}
            {relatorioExistente?.efetividadeCombate && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Efetividade</p>
                <p className="font-medium">{relatorioExistente.efetividadeCombate}</p>
              </div>
            )}
            {relatorioExistente?.acoesRealizadas?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Ações</p>
                <p className="font-medium">{relatorioExistente.acoesRealizadas.length} ação(ões)</p>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setMode('form-readonly')}
            >
              <Eye className="h-4 w-4" />
              Visualizar Relatório
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-command text-command hover:bg-command/10"
              onClick={() => setMode('form-edit')}
            >
              <Edit className="h-4 w-4" />
              Editar Relatório
            </Button>
            <Link to="/relatorio-pdf/$id" params={{ id }}>
              <Button
                className="gap-2 bg-fire hover:bg-fire/90 text-white"
              >
                <FileText className="h-4 w-4" />
                Exportar PDF
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Formulário Novo (sem relatório) ── */}
      {!hasRelatorio && mode === 'view-status' && (
        <div className="glass-strong rounded-xl border border-border p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h2 className="font-semibold">Preencher Relatório</h2>
              <p className="text-sm text-muted-foreground">Este despacho ainda não possui relatório de resposta.</p>
            </div>
          </div>
          <RelatorioTerrestreForm
            despachoId={despachoId}
            onSubmit={handleSubmit}
            onFilesChange={handleFilesChange}
          />
        </div>
      )}

      {/* ── Formulário de Edição ── */}
      {mode === 'form-edit' && (
        <div className="glass-strong rounded-xl border border-command/30 p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-command/20 flex items-center justify-center">
                <Edit className="h-5 w-5 text-command" />
              </div>
              <div>
                <h2 className="font-semibold">Editando Relatório</h2>
                <p className="text-sm text-muted-foreground">Alterações sobrescrevem o relatório existente.</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setMode('view-status')}>
              Cancelar
            </Button>
          </div>
          <RelatorioTerrestreForm
            despachoId={despachoId}
            initialData={relatorioExistente}
            onSubmit={handleSubmit}
            onFilesChange={handleFilesChange}
          />
        </div>
      )}

      {/* ── Modo Visualização (Read Only) ── */}
      {mode === 'form-readonly' && (
        <div className="glass-strong rounded-xl border border-border p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Visualizando Relatório</h2>
                <p className="text-sm text-muted-foreground">Modo somente leitura.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setMode('view-status')}>
                Voltar
              </Button>
              <Button variant="outline" size="sm" className="border-command text-command" onClick={() => setMode('form-edit')}>
                <Edit className="h-3 w-3 mr-1" /> Editar
              </Button>
            </div>
          </div>
          <RelatorioTerrestreForm
            despachoId={despachoId}
            initialData={relatorioExistente}
            readOnly
          />
        </div>
      )}

      {/* ── Barra de Ações do Formulário (Novo ou Edição) ── */}
      {(mode === 'form-edit' || (!hasRelatorio && mode === 'view-status')) && (
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
              onClick={() => mode === 'form-edit' ? setMode('view-status') : navigate({ to: '/despachos' })}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-terrestre"
              className="bg-fire hover:bg-fire/90 text-white gap-2"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                : <><CheckCircle2 className="h-4 w-4" /> {mode === 'form-edit' ? 'Salvar Alterações' : 'Finalizar Relatório'}</>
              }
            </Button>
          </div>
        </div>
      )}
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
