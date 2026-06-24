import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/relatorio-pdf/$id')({
  component: RelatorioPdfPage,
});

// ─────────────────────────────────────────────────
// Helpers de formatação
// ─────────────────────────────────────────────────

const ACOES_MAP: Record<string, string> = {
  RECONHECIMENTO_PLANEJAMENTO: 'Reconhecimento e Planejamento',
  COMBATE_DIRETO: 'Combate a Incêndio florestal direto',
  ACEIRO_MANUAL: 'Confecção de aceiro manual',
  ACEIRO_MECANICO_APOIO: 'Confecção de aceiro mecânico com apoio de terceiros',
  FOGO_CONTRAFOGO: 'Realização de fogo contrafogo',
  VIGILANCIA: 'Vigilância',
  RESCALDO: 'Rescaldo',
  NENHUMA: 'Nenhuma ação foi executada',
};

const ORGAOS_MAP: Record<string, string> = {
  EXERCITO: 'Exército Brasileiro', FAB: 'Força Aérea do Brasil', MARINHA: 'Marinha do Brasil',
  PM: 'Polícia Militar', ICMBIO: 'ICMBio', IBAMA: 'Ibama', SINFRA: 'SINFRA',
  SEMA: 'SEMA', DEFESA_CIVIL: 'Defesa Civil Estadual', PREFEITURA: 'Prefeitura Municipal',
  OUTROS: 'Outros', NENHUM: 'Nenhum órgão de Apoio',
};

const ORIGENS_MAP: Record<string, string> = {
  RAIO: 'Raio (descarga elétrica atmosférica)',
  QUEIMADA_LIXO: 'Queimada ilegal de lixo e folhas',
  QUEIMA_LENHOSO: 'Queima ilegal de material lenhoso enleirado',
  ACIDENTE_VEICULAR: 'Acidente veicular',
  INTENCIONAL: 'Ação intencional (incendiário / criminosa)',
  EXTRATIVISMO: 'Atividade extrativista',
  REDE_ELETRICA: 'Problemas na rede elétrica',
  SEM_INDICIOS: 'Sem indícios da possível causa',
  OUTRO: 'Outros',
};

const RESULTADO_MAP: Record<string, string> = {
  EM_ANDAMENTO: 'Em andamento',
  NECESSIDADE_FISCALIZACAO: 'Necessidade de equipe de fiscalização',
  SEM_INTERVENCAO: 'Sem necessidade de intervenção',
  EXTINTO_RESOLVIDA: 'Incêndio extinto / Resolvida',
  DESPACHO_INCORRETO: 'Despacho incorreto',
  OUTRO: 'Outro',
};

const EFETIVIDADE_MAP: Record<string, string> = {
  ALTA: 'Alta',
  MEDIA: 'Média',
  BAIXA: 'Baixa',
};

function formatDate(d: string | undefined) {
  if (!d) return '--';
  try { return format(new Date(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }); }
  catch { return d; }
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <h3 className="font-bold text-base bg-gray-100 p-1 px-2 border-l-4 border-fire mt-6">
      {number}. {title}
    </h3>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="py-1">
      <span className="font-semibold">{label}: </span>
      <span>{value ?? '--'}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────

function RelatorioPdfPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data: despacho, isLoading: loadingDespacho } = useQuery<any>({
    queryKey: ['despacho', id],
    queryFn: () => fetchWithAuth(`/operacional/despachos/${id}`),
  });

  const osId = despacho?.ordemServicoId;
  const { data: os } = useQuery<any>({
    queryKey: ['os', osId],
    queryFn: () => fetchWithAuth(`/operacional/os/${osId}`),
    enabled: !!osId,
  });

  const { data: relatorio, isLoading: loadingRelatorio } = useQuery<any>({
    queryKey: ['relatorio-terrestre', id],
    queryFn: async () => {
      try {
        return await fetchWithAuth(`/operacional/despachos/${id}/relatorio-terrestre`);
      } catch {
        return null;
      }
    },
    enabled: !!despacho,
  });

  if (loadingDespacho || loadingRelatorio) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Gerando PDF...</p>
      </div>
    );
  }

  if (!despacho) {
    return <div className="p-8 text-center text-red-500">Despacho não encontrado.</div>;
  }

  const emitidoEm = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center">
      {/* Barra de Ações (oculta na impressão) */}
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

      {/* ── Folha A4 ── */}
      <div className="w-full max-w-[210mm] min-h-[297mm] bg-white my-8 p-12 shadow-lg print:shadow-none print:m-0 print:p-8">

        {/* Cabeçalho */}
        <div className="text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-xl font-bold uppercase tracking-wider">
            Corpo de Bombeiros Militar — Fortivus
          </h1>
          <h2 className="text-base font-semibold mt-1">Relatório Operacional de Despacho Terrestre</h2>
          <p className="text-xs text-gray-600 mt-1">Emitido em {emitidoEm}</p>
        </div>

        <div className="space-y-2 text-sm">

          {/* 1. Dados do Despacho */}
          <SectionHeader number="1" title="Dados do Despacho" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 px-2">
            <Field label="ID Despacho" value={`D${String(despacho.id).padStart(12, '0')}`} />
            <Field label="Ordem de Serviço" value={os ? `OS-${os.id}` : '--'} />
            <Field label="Categoria" value={despacho.categoria || '--'} />
            <Field label="Status" value={despacho.status} />
            <Field label="Data Início" value={formatDate(despacho.dataInicio)} />
            <Field label="Data Fim" value={formatDate(despacho.dataFim)} />
            <Field label="Responsável ID" value={despacho.responsavelId} />
          </div>

          {/* 2. Descrição / Diretrizes */}
          <SectionHeader number="2" title="Descrição / Diretrizes" />
          <div className="mt-2 px-2 whitespace-pre-wrap text-justify leading-relaxed">
            {despacho.descricaoTarefa || 'Nenhuma descrição informada.'}
          </div>

          {relatorio ? (
            <>
              {/* 3. Ações de Combate */}
              <SectionHeader number="3" title="Ações de Combate Realizadas" />
              <ul className="mt-2 px-2 list-disc list-inside space-y-1">
                {relatorio.acoesRealizadas?.map((a: string) => (
                  <li key={a}>{ACOES_MAP[a] ?? a}</li>
                ))}
              </ul>

              {/* 4. Órgãos de Apoio */}
              <SectionHeader number="4" title="Órgãos de Apoio" />
              <ul className="mt-2 px-2 list-disc list-inside space-y-1">
                {relatorio.orgaosApoio?.map((o: string) => (
                  <li key={o}>{ORGAOS_MAP[o] ?? o}</li>
                ))}
              </ul>
              {relatorio.outrosOrgaosDescricao && (
                <p className="px-2 text-xs italic text-gray-600">Outros: {relatorio.outrosOrgaosDescricao}</p>
              )}

              {/* 5. Uso de Água */}
              <SectionHeader number="5" title="Uso de Água" />
              <div className="mt-2 px-2">
                <Field label="Houve uso de água" value={relatorio.houveUsoAgua ? 'Sim' : 'Não'} />
                {relatorio.houveUsoAgua && (
                  <>
                    <Field label="Volume (litros)" value={relatorio.volumeAguaLitros} />
                    {relatorio.origensAgua?.length > 0 && (
                      <div>
                        <span className="font-semibold">Origens: </span>
                        {relatorio.origensAgua.join(', ')}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 6. Apoio de Propriedades */}
              <SectionHeader number="6" title="Apoio de Propriedades Rurais" />
              <div className="mt-2 px-2">
                <Field label="Houve apoio" value={relatorio.houveApoioPropriedades ? 'Sim' : 'Não'} />
                <Field label="Houve recusa" value={relatorio.houveRecusaPropriedades ? 'Sim' : 'Não'} />
                {relatorio.propriedades?.filter((p: any) => p.tipoRegistro === 'APOIO').map((p: any, i: number) => (
                  <div key={i} className="mt-2 pl-4 border-l-2 border-gray-200">
                    <p className="font-medium">{p.nomePropriedade || `Propriedade ${i + 1}`}</p>
                    {p.responsavel && <p className="text-xs">Resp.: {p.responsavel} {p.telefone && `— ${p.telefone}`}</p>}
                    {p.tipoApoio && <p className="text-xs">Tipo de apoio: {p.tipoApoio}</p>}
                  </div>
                ))}
              </div>

              {/* 7. Origem do Incêndio */}
              <SectionHeader number="7" title="Possível Origem do Incêndio" />
              <div className="mt-2 px-2">
                <Field
                  label="Origem"
                  value={relatorio.possivelOrigemIncendio ? (ORIGENS_MAP[relatorio.possivelOrigemIncendio] ?? relatorio.possivelOrigemIncendio) : '--'}
                />
                {relatorio.outraOrigemDescricao && (
                  <p className="text-xs italic text-gray-600">Descrição: {relatorio.outraOrigemDescricao}</p>
                )}
              </div>

              {/* 8. Efetividade e Reforço */}
              <SectionHeader number="8" title="Efetividade e Necessidade de Reforço" />
              <div className="mt-2 px-2 grid grid-cols-2 gap-x-6">
                <Field
                  label="Efetividade"
                  value={relatorio.efetividadeCombate ? (EFETIVIDADE_MAP[relatorio.efetividadeCombate] ?? relatorio.efetividadeCombate) : '--'}
                />
                <Field label="Reforço necessário" value={relatorio.necessidadeReforco ? 'Sim' : 'Não'} />
                {relatorio.tiposReforcoNecessarios?.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-semibold">Tipos de reforço: </span>
                    {relatorio.tiposReforcoNecessarios.join(', ')}
                  </div>
                )}
              </div>

              {/* 9. Histórico */}
              <SectionHeader number="9" title="Histórico Descritivo" />
              <div className="mt-2 px-2 whitespace-pre-wrap text-justify leading-relaxed border border-gray-200 p-3 rounded bg-gray-50">
                {relatorio.historicoDescritivo || 'Não informado.'}
              </div>

              {/* 10. Resultado */}
              <SectionHeader number="10" title="Resultado da Ocorrência" />
              <div className="mt-2 px-2">
                <Field
                  label="Resultado"
                  value={relatorio.resultadoOcorrencia ? (RESULTADO_MAP[relatorio.resultadoOcorrencia] ?? relatorio.resultadoOcorrencia) : '--'}
                />
                {relatorio.outroResultadoDescricao && (
                  <p className="text-xs italic text-gray-600">Descrição: {relatorio.outroResultadoDescricao}</p>
                )}
                {relatorio.kmFinal && <Field label="KM Final do Veículo" value={relatorio.kmFinal} />}
              </div>

              {/* 11. Datas do Relatório */}
              <SectionHeader number="11" title="Registro do Relatório" />
              <div className="mt-2 px-2 grid grid-cols-2 gap-x-6">
                <Field label="Início da Ocorrência" value={formatDate(relatorio.dataInicio)} />
                <Field label="Finalização do Relatório" value={formatDate(relatorio.dataFim)} />
              </div>
            </>
          ) : (
            /* Sem relatório de campo */
            <>
              <SectionHeader number="3" title="Relatório de Campo" />
              <div className="mt-2 px-2 italic text-gray-500 border border-dashed border-gray-300 p-4 rounded">
                Este despacho ainda não possui um relatório de campo preenchido pela equipe.
                Acesse a ação "Responder Terrestre" para preencher o relatório.
              </div>
            </>
          )}

          {/* Assinatura */}
          <div className="mt-16 pt-8 text-center w-full flex flex-col items-center justify-center border-t border-gray-300">
            <div className="w-64 border-t border-black mb-2 mt-8" />
            <p className="font-semibold uppercase text-sm">
              {despacho.responsavelId ? `Responsável ID: ${despacho.responsavelId}` : 'Comandante da Equipe'}
            </p>
            <p className="text-xs text-gray-500">Assinatura do Responsável pela Guarnição</p>
            <p className="text-xs text-gray-400 mt-4">
              Documento gerado pelo Sistema Fortivus em {emitidoEm}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
