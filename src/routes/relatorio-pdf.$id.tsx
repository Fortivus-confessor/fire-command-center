import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/relatorio-pdf/$id')({
  component: RelatorioPdfPage,
});

function RelatorioPdfPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data: despacho, isLoading } = useQuery<any>({
    queryKey: ['despacho', id],
    queryFn: () => fetchWithAuth(`/operacional/despachos/${id}`),
  });

  const osId = despacho?.ordemServicoId;

  const { data: os } = useQuery<any>({
    queryKey: ['os', osId],
    queryFn: () => fetchWithAuth(`/operacional/os/${osId}`),
    enabled: !!osId,
  });

  if (isLoading) return <div className="p-8 text-center">Gerando PDF...</div>;
  if (!despacho) return <div className="p-8 text-center text-red-500">Despacho não encontrado.</div>;

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center">
      {/* Barra de Ações (Oculta na impressão) */}
      <div className="w-full bg-white border-b p-4 flex justify-between items-center print:hidden shadow-sm">
        <Button variant="outline" onClick={() => navigate({ to: '/despachos' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={() => window.print()} className="bg-fire hover:bg-fire/90">
          <Printer className="h-4 w-4 mr-2" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      {/* Folha A4 */}
      <div className="w-full max-w-[210mm] min-h-[297mm] bg-white my-8 p-12 shadow-lg print:shadow-none print:m-0 print:p-0">
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wider">Corpo de Bombeiros Militar do Estado de Mato Grosso</h1>
          <h2 className="text-lg font-semibold mt-1">Sistema ARGOS - Relatório Operacional de Despacho</h2>
          <p className="text-sm text-gray-600 mt-2">Emitido em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>

        <div className="space-y-6 text-sm">
          <section>
            <h3 className="font-bold text-base bg-gray-100 p-1 px-2 border-l-4 border-fire">1. Dados do Despacho</h3>
            <div className="grid grid-cols-2 gap-4 mt-2 px-2">
              <div><span className="font-semibold">ID Despacho:</span> D{String(despacho.id).padStart(12, '0')}</div>
              <div><span className="font-semibold">Ordem de Serviço:</span> {os ? `OS-${os.id}` : '--'}</div>
              <div><span className="font-semibold">Categoria:</span> {despacho.categoria || '--'}</div>
              <div><span className="font-semibold">Status:</span> {despacho.status}</div>
              <div><span className="font-semibold">Data Início:</span> {despacho.dataInicio ? format(new Date(despacho.dataInicio), "dd/MM/yyyy HH:mm") : '--'}</div>
              <div><span className="font-semibold">Data Fim:</span> {despacho.dataFim ? format(new Date(despacho.dataFim), "dd/MM/yyyy HH:mm") : '--'}</div>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-base bg-gray-100 p-1 px-2 border-l-4 border-fire">2. Descrição / Diretrizes</h3>
            <div className="mt-2 px-2 whitespace-pre-wrap text-justify">
              {despacho.descricaoTarefa || 'Nenhuma descrição informada.'}
            </div>
          </section>

          <section>
            <h3 className="font-bold text-base bg-gray-100 p-1 px-2 border-l-4 border-fire">3. Relatório de Ações (Resposta)</h3>
            <div className="mt-2 px-2 italic text-gray-600 text-justify border border-dashed border-gray-300 p-4 rounded">
              Este relatório compila as atividades de resposta registradas pela equipe em campo. 
              As informações detalhadas sobre efetividade, materiais utilizados, órgãos de apoio e histórico 
              descritivo estarão disponíveis em versões futuras conectadas ao Serviço de Relatórios.
              <br/><br/>
              <span className="font-semibold">Resultado da ocorrência reportada pela guarnição responsável.</span>
            </div>
          </section>

          <div className="mt-24 pt-8 text-center w-full flex flex-col items-center justify-center">
            <div className="w-64 border-t border-black mb-2"></div>
            <p className="font-semibold uppercase">{despacho.responsavelId ? `Usuário ID: ${despacho.responsavelId}` : 'Comandante da Equipe'}</p>
            <p className="text-xs text-gray-500">Assinatura do Responsável</p>
          </div>
        </div>
      </div>
    </div>
  );
}
