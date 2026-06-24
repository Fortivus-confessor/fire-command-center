import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MapPin, Plus, Trash2, AlertCircle } from 'lucide-react';
import { LocationPickerMap } from '@/components/fortivus/map/LocationPickerMap';
import SituationMapClient from '@/components/fortivus/map/SituationMapClient';
import { FileUploader } from '@/components/fortivus/forms/FileUploader';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ────────────────────────────────────────────────────
// Mapeamento dos enums do backend → label exibida
// ────────────────────────────────────────────────────

const ACOES_COMBATE = [
  { value: 'RECONHECIMENTO_PLANEJAMENTO', label: 'Reconhecimento e Planejamento' },
  { value: 'COMBATE_DIRETO', label: 'Combate a Incêndio florestal direto' },
  { value: 'ACEIRO_MANUAL', label: 'Confecção de aceiro manual' },
  { value: 'ACEIRO_MECANICO_APOIO', label: 'Confecção de aceiro mecânico com apoio de terceiros' },
  { value: 'FOGO_CONTRAFOGO', label: 'Realização de fogo contrafogo' },
  { value: 'VIGILANCIA', label: 'Vigilância' },
  { value: 'RESCALDO', label: 'Rescaldo' },
  { value: 'NENHUMA', label: 'Nenhuma ação foi executada' },
];

const ORGAOS_APOIO = [
  { value: 'EXERCITO', label: 'Exército Brasileiro' },
  { value: 'FAB', label: 'Força Aérea do Brasil' },
  { value: 'MARINHA', label: 'Marinha do Brasil' },
  { value: 'PM', label: 'Polícia Militar' },
  { value: 'ICMBIO', label: 'ICMBio' },
  { value: 'IBAMA', label: 'Ibama' },
  { value: 'SINFRA', label: 'SINFRA' },
  { value: 'SEMA', label: 'SEMA' },
  { value: 'DEFESA_CIVIL', label: 'Defesa Civil Estadual' },
  { value: 'PREFEITURA', label: 'Prefeitura Municipal' },
  { value: 'OUTROS', label: 'Outros' },
  { value: 'NENHUM', label: 'Nenhum órgão de Apoio' },
];

const ORIGENS_INCENDIO = [
  { value: 'RAIO', label: 'Raio (descarga elétrica atmosférica)' },
  { value: 'QUEIMADA_LIXO', label: 'Queimada ilegal de lixo e folhas' },
  { value: 'QUEIMA_LENHOSO', label: 'Queima ilegal de material lenhoso enleirado' },
  { value: 'ACIDENTE_VEICULAR', label: 'Acidente veicular' },
  { value: 'INTENCIONAL', label: 'Ação intencional (incendiário / criminosa)' },
  { value: 'EXTRATIVISMO', label: 'Atividade extrativista (carvão, mel, coleta, etc.)' },
  { value: 'REDE_ELETRICA', label: 'Problemas na rede elétrica (curto circuito, cabo rompido, transformador, etc.)' },
  { value: 'SEM_INDICIOS', label: 'Sem indícios da possível causa' },
  { value: 'OUTRO', label: 'Outros' },
];

const RESULTADOS = [
  { value: 'EM_ANDAMENTO', label: 'Em andamento', desc: 'Combate ativo no momento do preenchimento, sem extinção total.' },
  { value: 'NECESSIDADE_FISCALIZACAO', label: 'Necessidade de equipe de fiscalização', desc: 'Ex: queima controlada ou intencional, fogo já extinto, situação monitorada.' },
  { value: 'SEM_INTERVENCAO', label: 'Sem necessidade de intervenção', desc: 'Incêndio extinto sozinho ou por terceiros antes da chegada da equipe.' },
  { value: 'EXTINTO_RESOLVIDA', label: 'Incêndio extinto / Resolvida', desc: 'Equipe concluiu o combate e confirmou extinção completa do fogo.' },
  { value: 'DESPACHO_INCORRETO', label: 'Despacho incorreto', desc: 'Não foi encontrado nenhum incêndio ou queimada nas imediações.' },
  { value: 'OUTRO', label: 'Outro:', desc: '' },
];

const ORIGENS_AGUA = [
  { value: 'NATURAL', label: "Curso d'água natural (rio, lago, represa)" },
  { value: 'HIDRANTE', label: 'Hidrante' },
  { value: 'RESERVATORIO_FIXO', label: "Reservatório fixo (cisterna, caixa d'água)" },
  { value: 'OUTRO', label: 'Outro:' },
];

const MOTIVOS_RECUSA = [
  { value: 'PASSAGEM', label: 'Não autorizou passagem pela propriedade' },
  { value: 'AGUA', label: 'Recusou fornecimento de água' },
  { value: 'RECURSOS_NAO_DISPONIBILIZADOS', label: 'Não disponibilizou recursos disponíveis' },
  { value: 'COMBATE', label: 'Se recusou a combater o incêndio' },
  { value: 'RECOMENDACOES', label: 'Se recusou a atender as recomendações da agência' },
  { value: 'CONTRAFOGO_DESORDENADO', label: 'Realizou fogo contrafogo de maneira desordenada' },
  { value: 'OUTRO', label: 'Outro:' },
];

// ────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────

export interface RelatorioTerrestrePayload {
  despachoId: number;
  acoesRealizadas: string[];
  orgaosApoio: string[];
  outrosOrgaosDescricao?: string;
  areaAtuacaoLat?: number;
  areaAtuacaoLng?: number;
  houveUsoAgua: boolean;
  volumeAguaLitros?: number;
  origensAgua?: string[];
  outraOrigemAguaDescricao?: string;
  houveApoioPropriedades: boolean;
  houveRecusaPropriedades: boolean;
  propriedades?: PropriedadePayload[];
  possivelOrigemIncendio: string;
  outraOrigemDescricao?: string;
  efetividadeCombate: string;
  necessidadeReforco: boolean;
  tiposReforcoNecessarios?: string[];
  historicoDescritivo: string;
  resultadoOcorrencia: string;
  outroResultadoDescricao?: string;
}

interface PropriedadePayload {
  nomePropriedade?: string;
  responsavel?: string;
  telefone?: string;
  localizacaoLat?: number;
  localizacaoLng?: number;
  tipoRegistro: 'APOIO' | 'RECUSA';
  tipoApoio?: string;
  quantidadeApoio?: number;
  descricaoApoioOutro?: string;
  motivoRecusa?: string;
  descricaoRecusaOutro?: string;
}

interface PropriedadeApoioState {
  id: number;
  nome: string;
  responsavel: string;
  telefone: string;
  tipoApoio: string;
  quantidadeApoio: string;
  descricaoApoioOutro: string;
  mapOpen: boolean;
}

interface PropriedadeRecusaState {
  id: number;
  nome: string;
  responsavel: string;
  telefone: string;
  motivoRecusa: string;
  descricaoRecusaOutro: string;
  mapOpen: boolean;
}

interface ValidationErrors {
  acoes?: string;
  orgaos?: string;
  origem?: string;
  efetividade?: string;
  historico?: string;
  resultado?: string;
  volumeAgua?: string;
  outrosOrgaos?: string;
  outraOrigem?: string;
  outroResultado?: string;
  propriedadesApoio?: Record<number, { nome?: string; responsavel?: string }>;
}

interface RelatorioTerrestreFormProps {
  despachoId: number;
  readOnly?: boolean;
  initialData?: any;
  onSubmit?: (payload: RelatorioTerrestrePayload) => Promise<void>;
  onFilesChange?: (key: string, files: File[]) => void;
  onFileRemove?: (url: string) => void;
  despachoLat?: number;
  despachoLng?: number;
  eventoFogoId?: string;
}

// ────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────

export function RelatorioTerrestreForm({
  despachoId,
  readOnly = false,
  initialData,
  onSubmit,
  onFilesChange,
  onFileRemove,
  despachoLat,
  despachoLng,
  eventoFogoId,
}: RelatorioTerrestreFormProps) {
  // ── Área de Atuação ──
  const [areaAtuacaoLat, setAreaAtuacaoLat] = useState<number | undefined>(initialData?.areaAtuacaoLat);
  const [areaAtuacaoLng, setAreaAtuacaoLng] = useState<number | undefined>(initialData?.areaAtuacaoLng);

  // ── Ações de Combate ──
  const [acoesRealizadas, setAcoesRealizadas] = useState<string[]>(initialData?.acoesRealizadas ?? []);

  // ── Órgãos de Apoio ──
  const [orgaosApoio, setOrgaosApoio] = useState<string[]>(initialData?.orgaosApoio ?? []);
  const [outrosOrgaosDescricao, setOutrosOrgaosDescricao] = useState(initialData?.outrosOrgaosDescricao ?? '');

  // ── Uso de Água ──
  const [houveUsoAgua, setHouveUsoAgua] = useState<boolean>(initialData?.houveUsoAgua ?? false);
  const [volumeAguaLitros, setVolumeAguaLitros] = useState(initialData?.volumeAguaLitros?.toString() ?? '');
  const [origensAgua, setOrigensAgua] = useState<string[]>(initialData?.origensAgua ?? []);
  const [outraOrigemAguaDescricao, setOutraOrigemAguaDescricao] = useState(initialData?.outraOrigemAguaDescricao ?? '');

  // ── Apoio Rural ──
  const [houveApoioPropriedades, setHouveApoioPropriedades] = useState<boolean>(initialData?.houveApoioPropriedades ?? false);
  const [propriedadesApoio, setPropriedadesApoio] = useState<PropriedadeApoioState[]>(
    initialData?.propriedades
      ?.filter((p: any) => p.tipoRegistro === 'APOIO')
      .map((p: any, idx: number) => ({
        id: idx + 1,
        nome: p.nomePropriedade ?? '',
        responsavel: p.responsavel ?? '',
        telefone: p.telefone ?? '',
        tipoApoio: p.tipoApoio ?? '',
        quantidadeApoio: p.quantidadeApoio?.toString() ?? '',
        descricaoApoioOutro: p.descricaoApoioOutro ?? '',
        mapOpen: false,
      })) ?? [{ id: 1, nome: '', responsavel: '', telefone: '', tipoApoio: '', quantidadeApoio: '', descricaoApoioOutro: '', mapOpen: false }]
  );

  // ── Recusa Rural ──
  const [houveRecusaPropriedades, setHouveRecusaPropriedades] = useState<boolean>(initialData?.houveRecusaPropriedades ?? false);
  const [propriedadesRecusa, setPropriedadesRecusa] = useState<PropriedadeRecusaState[]>(
    initialData?.propriedades
      ?.filter((p: any) => p.tipoRegistro === 'RECUSA')
      .map((p: any, idx: number) => ({
        id: idx + 1,
        nome: p.nomePropriedade ?? '',
        responsavel: p.responsavel ?? '',
        telefone: p.telefone ?? '',
        motivoRecusa: p.motivoRecusa ?? '',
        descricaoRecusaOutro: p.descricaoRecusaOutro ?? '',
        mapOpen: false,
      })) ?? [{ id: 1, nome: '', responsavel: '', telefone: '', motivoRecusa: '', descricaoRecusaOutro: '', mapOpen: false }]
  );

  // ── Origem do Incêndio ──
  const [possivelOrigemIncendio, setPossivelOrigemIncendio] = useState(initialData?.possivelOrigemIncendio ?? '');
  const [outraOrigemDescricao, setOutraOrigemDescricao] = useState(initialData?.outraOrigemDescricao ?? '');

  // ── Efetividade ──
  const [efetividadeCombate, setEfetividadeCombate] = useState(initialData?.efetividadeCombate ?? '');

  // ── Reforço ──
  const [necessidadeReforco, setNecessidadeReforco] = useState<boolean>(initialData?.necessidadeReforco ?? false);
  const [tiposReforcoNecessarios, setTiposReforcoNecessarios] = useState<string[]>(initialData?.tiposReforcoNecessarios ?? []);

  // ── Histórico e Resultado ──
  const [historicoDescritivo, setHistoricoDescritivo] = useState(initialData?.historicoDescritivo ?? '');
  const [resultadoOcorrencia, setResultadoOcorrencia] = useState(initialData?.resultadoOcorrencia ?? '');
  const [outroResultadoDescricao, setOutroResultadoDescricao] = useState(initialData?.outroResultadoDescricao ?? '');

  // ── Erros de validação ──
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // ────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────

  const toggleSet = (value: string, current: string[], setter: (v: string[]) => void) => {
    setter(current.includes(value) ? current.filter(v => v !== value) : [...current, value]);
  };

  const fieldError = (field: keyof ValidationErrors) =>
    errors[field] ? (
      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3" /> {errors[field] as string}
      </p>
    ) : null;

  // ────────────────────────────────────────────────────
  // Validação
  // ────────────────────────────────────────────────────

  const validate = (): ValidationErrors => {
    const errs: ValidationErrors = {};

    if (acoesRealizadas.length === 0) errs.acoes = 'Selecione pelo menos uma ação de combate.';
    if (orgaosApoio.length === 0) errs.orgaos = 'Selecione pelo menos um órgão de apoio.';
    if (orgaosApoio.includes('OUTROS') && !outrosOrgaosDescricao.trim()) errs.outrosOrgaos = 'Descreva os outros órgãos de apoio.';
    if (!possivelOrigemIncendio) errs.origem = 'Selecione a possível origem do incêndio.';
    if (possivelOrigemIncendio === 'OUTRO' && !outraOrigemDescricao.trim()) errs.outraOrigem = 'Descreva a outra origem.';
    if (!efetividadeCombate) errs.efetividade = 'Informe a efetividade estimada.';
    if (!historicoDescritivo.trim()) errs.historico = 'O histórico descritivo é obrigatório.';
    if (historicoDescritivo.trim().length < 20) errs.historico = 'O histórico deve ter pelo menos 20 caracteres.';
    if (!resultadoOcorrencia) errs.resultado = 'Selecione o resultado da ocorrência.';
    if (resultadoOcorrencia === 'OUTRO' && !outroResultadoDescricao.trim()) errs.outroResultado = 'Descreva o outro resultado.';
    if (houveUsoAgua && (!volumeAguaLitros || Number(volumeAguaLitros) <= 0)) errs.volumeAgua = 'Informe o volume de água utilizado.';
    if (!areaAtuacaoLat || !areaAtuacaoLng) errs.areaAtuacao = 'Selecione a área de atuação no mapa.';

    return errs;
  };

  // ────────────────────────────────────────────────────
  // Submit
  // ────────────────────────────────────────────────────

  const handleLocalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);

    const errs = validate();
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      toast.error('Formulário incompleto', {
        description: 'Corrija os campos em vermelho antes de continuar.',
      });
      // Scroll para o primeiro erro
      const firstError = document.querySelector('[data-error="true"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const propriedades: PropriedadePayload[] = [];

    if (houveApoioPropriedades) {
      propriedadesApoio.forEach(p => {
        propriedades.push({
          nomePropriedade: p.nome,
          responsavel: p.responsavel,
          telefone: p.telefone,
          tipoRegistro: 'APOIO',
          tipoApoio: p.tipoApoio || undefined,
          quantidadeApoio: p.quantidadeApoio ? Number(p.quantidadeApoio) : undefined,
          descricaoApoioOutro: p.descricaoApoioOutro || undefined,
        });
      });
    }

    if (houveRecusaPropriedades) {
      propriedadesRecusa.forEach(p => {
        propriedades.push({
          nomePropriedade: p.nome,
          responsavel: p.responsavel,
          telefone: p.telefone,
          tipoRegistro: 'RECUSA',
          motivoRecusa: p.motivoRecusa || undefined,
          descricaoRecusaOutro: p.descricaoRecusaOutro || undefined,
        });
      });
    }

    const payload: RelatorioTerrestrePayload = {
      despachoId,
      acoesRealizadas,
      orgaosApoio,
      outrosOrgaosDescricao: orgaosApoio.includes('OUTROS') ? outrosOrgaosDescricao : undefined,
      areaAtuacaoLat,
      areaAtuacaoLng,
      houveUsoAgua,
      volumeAguaLitros: houveUsoAgua && volumeAguaLitros ? Number(volumeAguaLitros) : undefined,
      origensAgua: houveUsoAgua ? origensAgua : undefined,
      outraOrigemAguaDescricao: houveUsoAgua && origensAgua.includes('OUTRO') ? outraOrigemAguaDescricao : undefined,
      houveApoioPropriedades,
      houveRecusaPropriedades,
      propriedades: propriedades.length > 0 ? propriedades : undefined,
      possivelOrigemIncendio,
      outraOrigemDescricao: possivelOrigemIncendio === 'OUTRO' ? outraOrigemDescricao : undefined,
      efetividadeCombate,
      necessidadeReforco,
      tiposReforcoNecessarios: necessidadeReforco ? tiposReforcoNecessarios : undefined,
      historicoDescritivo,
      resultadoOcorrencia,
      outroResultadoDescricao: resultadoOcorrencia === 'OUTRO' ? outroResultadoDescricao : undefined,
    };

    if (onSubmit) {
      await onSubmit(payload);
    }
  };

  // ────────────────────────────────────────────────────
  // Render helpers
  // ────────────────────────────────────────────────────

  const sectionClass = (hasError: boolean) =>
    cn('space-y-3 p-4 rounded-lg border transition-colors',
      hasError && submitted ? 'border-destructive/50 bg-destructive/5' : 'border-transparent'
    );

  const sectionHeader = (title: string, required = true) => (
    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
      {title} {required && <span className="text-destructive">*</span>}
    </h3>
  );

  return (
    <form id="form-terrestre" onSubmit={handleLocalSubmit} className="space-y-6 p-1" noValidate>

      {/* ── Ações de Combate ── */}
      <div
        className={sectionClass(!!errors.acoes)}
        data-error={submitted && !!errors.acoes}
      >
        {sectionHeader('Ações de Combate Realizadas')}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACOES_COMBATE.map(a => (
            <div key={a.value} className="flex items-start space-x-2">
              <Checkbox
                id={`acao-${a.value}`}
                disabled={readOnly}
                checked={acoesRealizadas.includes(a.value)}
                onCheckedChange={() => !readOnly && toggleSet(a.value, acoesRealizadas, setAcoesRealizadas)}
              />
              <label htmlFor={`acao-${a.value}`} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                {a.label}
              </label>
            </div>
          ))}
        </div>
        {submitted && fieldError('acoes')}
      </div>

      {/* ── Órgãos de Apoio ── */}
      <div
        className={sectionClass(!!errors.orgaos || !!errors.outrosOrgaos)}
        data-error={submitted && (!!errors.orgaos || !!errors.outrosOrgaos)}
      >
        {sectionHeader('Órgãos de Apoio')}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ORGAOS_APOIO.map(o => (
            <div key={o.value} className="flex items-start space-x-2">
              <Checkbox
                id={`orgao-${o.value}`}
                disabled={readOnly}
                checked={orgaosApoio.includes(o.value)}
                onCheckedChange={() => !readOnly && toggleSet(o.value, orgaosApoio, setOrgaosApoio)}
              />
              <label htmlFor={`orgao-${o.value}`} className="text-sm leading-none cursor-pointer">{o.label}</label>
            </div>
          ))}
        </div>
        {orgaosApoio.includes('OUTROS') && (
          <div className="mt-2">
            <Input
              placeholder="Descreva os outros órgãos..."
              value={outrosOrgaosDescricao}
              disabled={readOnly}
              onChange={e => setOutrosOrgaosDescricao(e.target.value)}
              className={cn(submitted && errors.outrosOrgaos && 'border-destructive')}
            />
            {submitted && fieldError('outrosOrgaos')}
          </div>
        )}
        {submitted && !errors.outrosOrgaos && fieldError('orgaos')}
      </div>

      {/* ── Área de Atuação ── */}
      <div className={sectionClass(!!errors.areaAtuacao)} data-error={submitted && !!errors.areaAtuacao}>
        {sectionHeader('Área de Atuação da Equipe')}
        <div className="relative rounded-lg overflow-hidden border border-border h-[350px]">
          <SituationMapClient 
             hideEvents={!eventoFogoId}
             isolatedEventId={eventoFogoId}
             dispatchPin={despachoLat && despachoLng ? { lat: despachoLat, lng: despachoLng } : null}
             activePin={areaAtuacaoLat && areaAtuacaoLng ? { lat: areaAtuacaoLat, lng: areaAtuacaoLng } : null}
             onClickMap={(lat, lng) => {
               if (!readOnly) {
                 setAreaAtuacaoLat(lat);
                 setAreaAtuacaoLng(lng);
               }
             }}
             flyTo={despachoLat && despachoLng ? { lat: despachoLat, lng: despachoLng } : null}
          />
          <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-none">
            <div className="bg-background/80 backdrop-blur-sm border border-border text-xs px-2 py-1 rounded flex items-center gap-1 shadow-sm">
              <div className="w-2 h-2 rounded-full" style={{ background: '#3b82f6' }} /> Despacho Original
            </div>
            <div className="bg-background/80 backdrop-blur-sm border border-border text-xs px-2 py-1 rounded flex items-center gap-1 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-red-500" /> Local de Atuação
            </div>
          </div>
        </div>
        {submitted && fieldError('areaAtuacao')}
      </div>

      {/* ── Uso de Água ── */}
      <div className={sectionClass(!!errors.volumeAgua)} data-error={submitted && !!errors.volumeAgua}>
        {sectionHeader('Uso de Água na Ocorrência')}
        <RadioGroup
          value={houveUsoAgua ? 'sim' : 'nao'}
          onValueChange={v => !readOnly && setHouveUsoAgua(v === 'sim')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sim" id="agua-sim" disabled={readOnly} />
            <Label htmlFor="agua-sim">Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nao" id="agua-nao" disabled={readOnly} />
            <Label htmlFor="agua-nao">Não</Label>
          </div>
        </RadioGroup>

        {houveUsoAgua && (
          <div className="grid gap-4 pl-6 border-l-2 border-primary/20 mt-3">
            <div className="space-y-2">
              <Label>Quantidade (Litros) <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                placeholder="Ex: 5000"
                value={volumeAguaLitros}
                disabled={readOnly}
                min={1}
                onChange={e => setVolumeAguaLitros(e.target.value)}
                className={cn(submitted && errors.volumeAgua && 'border-destructive')}
              />
              {submitted && fieldError('volumeAgua')}
            </div>
            <div className="space-y-2">
              <Label>Origem da Água</Label>
              <div className="flex flex-col gap-2">
                {ORIGENS_AGUA.map(o => (
                  <div key={o.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`agua-${o.value}`}
                      disabled={readOnly}
                      checked={origensAgua.includes(o.value)}
                      onCheckedChange={() => !readOnly && toggleSet(o.value, origensAgua, setOrigensAgua)}
                    />
                    <label htmlFor={`agua-${o.value}`} className="text-sm font-medium leading-none cursor-pointer">{o.label}</label>
                    {o.value === 'OUTRO' && origensAgua.includes('OUTRO') && (
                      <Input
                        placeholder="Descreva"
                        value={outraOrigemAguaDescricao}
                        disabled={readOnly}
                        onChange={e => setOutraOrigemAguaDescricao(e.target.value)}
                        className="h-8 ml-2 flex-1 max-w-[200px]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Apoio de Propriedades Rurais ── */}
      <div className="space-y-4">
        {sectionHeader('Apoio de Propriedades Rurais')}
        <RadioGroup
          value={houveApoioPropriedades ? 'sim' : 'nao'}
          onValueChange={v => !readOnly && setHouveApoioPropriedades(v === 'sim')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sim" id="apoio-sim" disabled={readOnly} />
            <Label htmlFor="apoio-sim">Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nao" id="apoio-nao" disabled={readOnly} />
            <Label htmlFor="apoio-nao">Não</Label>
          </div>
        </RadioGroup>

        {houveApoioPropriedades && (
          <div className="space-y-4 pl-6 border-l-2 border-success/30">
            {propriedadesApoio.map((p) => (
              <div key={p.id} className="glass p-4 rounded-lg space-y-3 relative">
                {!readOnly && propriedadesApoio.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 text-destructive"
                    onClick={() => setPropriedadesApoio(prev => prev.filter(x => x.id !== p.id))}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
                <div className="space-y-1">
                  <Label>Nome da propriedade</Label>
                  <Input
                    placeholder="Fazenda Esperança"
                    value={p.nome}
                    disabled={readOnly}
                    onChange={e => setPropriedadesApoio(prev => prev.map(x => x.id === p.id ? { ...x, nome: e.target.value } : x))}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-muted-foreground"
                  disabled={readOnly}
                  onClick={() => setPropriedadesApoio(prev => prev.map(x => x.id === p.id ? { ...x, mapOpen: !x.mapOpen } : x))}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {p.mapOpen ? 'Ocultar mapa' : 'Inserir localização no mapa'}
                </Button>
                {p.mapOpen && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-border">
                    <LocationPickerMap height="200px" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Responsável</Label>
                    <Input
                      value={p.responsavel}
                      disabled={readOnly}
                      onChange={e => setPropriedadesApoio(prev => prev.map(x => x.id === p.id ? { ...x, responsavel: e.target.value } : x))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Telefone</Label>
                    <Input
                      placeholder="(XX) XXXXX-XXXX"
                      value={p.telefone}
                      disabled={readOnly}
                      onChange={e => setPropriedadesApoio(prev => prev.map(x => x.id === p.id ? { ...x, telefone: e.target.value } : x))}
                    />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Label>Tipo de apoio</Label>
                  <div className="space-y-2">
                    {['MAQUINARIO', 'MAO_DE_OBRA', 'OUTRO'].map(tipo => (
                      <div key={tipo} className="flex items-center gap-2">
                        <Checkbox
                          id={`apoio-tipo-${p.id}-${tipo}`}
                          disabled={readOnly}
                          checked={p.tipoApoio === tipo}
                          onCheckedChange={checked => setPropriedadesApoio(prev => prev.map(x => x.id === p.id ? { ...x, tipoApoio: checked ? tipo : '' } : x))}
                        />
                        <Label htmlFor={`apoio-tipo-${p.id}-${tipo}`}>
                          {tipo === 'MAQUINARIO' ? 'Maquinário' : tipo === 'MAO_DE_OBRA' ? 'Mão de obra' : 'Outro'}
                        </Label>
                        {p.tipoApoio === tipo && tipo !== 'OUTRO' && (
                          <Input
                            placeholder="Qtd."
                            className="h-6 w-20 text-xs ml-auto"
                            value={p.quantidadeApoio}
                            disabled={readOnly}
                            onChange={e => setPropriedadesApoio(prev => prev.map(x => x.id === p.id ? { ...x, quantidadeApoio: e.target.value } : x))}
                          />
                        )}
                        {p.tipoApoio === tipo && tipo === 'OUTRO' && (
                          <Input
                            placeholder="Descreva"
                            className="h-6 flex-1 text-xs ml-2"
                            value={p.descricaoApoioOutro}
                            disabled={readOnly}
                            onChange={e => setPropriedadesApoio(prev => prev.map(x => x.id === p.id ? { ...x, descricaoApoioOutro: e.target.value } : x))}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPropriedadesApoio(prev => [...prev, {
                  id: Date.now(), nome: '', responsavel: '', telefone: '',
                  tipoApoio: '', quantidadeApoio: '', descricaoApoioOutro: '', mapOpen: false,
                }])}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar outra propriedade
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Recusa de Colaboração ── */}
      <div className="space-y-4">
        {sectionHeader('Recusa de Colaboração')}
        <p className="text-xs text-muted-foreground">Algum proprietário rural se recusou a colaborar com a operação de combate?</p>
        <RadioGroup
          value={houveRecusaPropriedades ? 'sim' : 'nao'}
          onValueChange={v => !readOnly && setHouveRecusaPropriedades(v === 'sim')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sim" id="recusa-sim" disabled={readOnly} />
            <Label htmlFor="recusa-sim">Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nao" id="recusa-nao" disabled={readOnly} />
            <Label htmlFor="recusa-nao">Não</Label>
          </div>
        </RadioGroup>

        {houveRecusaPropriedades && (
          <div className="space-y-4 pl-6 border-l-2 border-destructive/30">
            {propriedadesRecusa.map((p) => (
              <div key={p.id} className="glass p-4 rounded-lg space-y-3 relative">
                {!readOnly && propriedadesRecusa.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 text-destructive"
                    onClick={() => setPropriedadesRecusa(prev => prev.filter(x => x.id !== p.id))}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
                <div className="space-y-1">
                  <Label>Nome da propriedade</Label>
                  <Input
                    value={p.nome}
                    disabled={readOnly}
                    onChange={e => setPropriedadesRecusa(prev => prev.map(x => x.id === p.id ? { ...x, nome: e.target.value } : x))}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-muted-foreground"
                  disabled={readOnly}
                  onClick={() => setPropriedadesRecusa(prev => prev.map(x => x.id === p.id ? { ...x, mapOpen: !x.mapOpen } : x))}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {p.mapOpen ? 'Ocultar mapa' : 'Inserir localização no mapa'}
                </Button>
                {p.mapOpen && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-border">
                    <LocationPickerMap height="200px" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Responsável (se conhecido)</Label>
                    <Input
                      value={p.responsavel}
                      disabled={readOnly}
                      onChange={e => setPropriedadesRecusa(prev => prev.map(x => x.id === p.id ? { ...x, responsavel: e.target.value } : x))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Telefone</Label>
                    <Input
                      value={p.telefone}
                      disabled={readOnly}
                      onChange={e => setPropriedadesRecusa(prev => prev.map(x => x.id === p.id ? { ...x, telefone: e.target.value } : x))}
                    />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Label>Motivo da recusa</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {MOTIVOS_RECUSA.map(m => (
                      <div key={m.value} className="flex items-start space-x-2">
                        <Checkbox
                          id={`recusa-motivo-${p.id}-${m.value}`}
                          disabled={readOnly}
                          checked={p.motivoRecusa === m.value}
                          onCheckedChange={checked => setPropriedadesRecusa(prev => prev.map(x => x.id === p.id ? { ...x, motivoRecusa: checked ? m.value : '' } : x))}
                        />
                        <label htmlFor={`recusa-motivo-${p.id}-${m.value}`} className="text-xs leading-none cursor-pointer">{m.label}</label>
                        {m.value === 'OUTRO' && p.motivoRecusa === 'OUTRO' && (
                          <Input
                            className="h-6 flex-1 text-xs ml-2"
                            value={p.descricaoRecusaOutro}
                            disabled={readOnly}
                            onChange={e => setPropriedadesRecusa(prev => prev.map(x => x.id === p.id ? { ...x, descricaoRecusaOutro: e.target.value } : x))}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPropriedadesRecusa(prev => [...prev, {
                  id: Date.now(), nome: '', responsavel: '', telefone: '',
                  motivoRecusa: '', descricaoRecusaOutro: '', mapOpen: false,
                }])}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar outra propriedade
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Origem do Incêndio ── */}
      <div
        className={sectionClass(!!errors.origem || !!errors.outraOrigem)}
        data-error={submitted && (!!errors.origem || !!errors.outraOrigem)}
      >
        {sectionHeader('Possível Origem do Incêndio')}
        <RadioGroup
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          value={possivelOrigemIncendio}
          onValueChange={v => !readOnly && setPossivelOrigemIncendio(v)}
        >
          {ORIGENS_INCENDIO.map(o => (
            <div key={o.value} className="flex items-start space-x-2">
              <RadioGroupItem value={o.value} id={`origem-${o.value}`} className="mt-0.5" disabled={readOnly} />
              <Label htmlFor={`origem-${o.value}`} className="text-sm font-normal leading-tight cursor-pointer">{o.label}</Label>
            </div>
          ))}
        </RadioGroup>
        {possivelOrigemIncendio === 'OUTRO' && (
          <div className="mt-4 max-w-xl">
            <Input
              placeholder="Descreva a outra origem..."
              value={outraOrigemDescricao}
              disabled={readOnly}
              onChange={e => setOutraOrigemDescricao(e.target.value)}
              className={cn(submitted && errors.outraOrigem && 'border-destructive')}
            />
            {submitted && fieldError('outraOrigem')}
          </div>
        )}
        <div className="max-w-2xl mt-4">
          <FileUploader
            label="Anexar Fotos do local de origem (com coordenadas)"
            maxFiles={1}
            initialUrls={initialData?.origem?.map((a: any) => a.url) || []}
            accept=".png,.jpg,.jpeg"
            onChange={files => onFilesChange && onFilesChange('origem', files)}
            onRemoveInitial={onFileRemove}
          />
        </div>
        {submitted && !errors.outraOrigem && fieldError('origem')}
      </div>

      {/* ── Efetividade ── */}
      <div
        className={sectionClass(!!errors.efetividade)}
        data-error={submitted && !!errors.efetividade}
      >
        {sectionHeader('Efetividade Estimada')}
        <RadioGroup
          className="flex gap-6"
          value={efetividadeCombate}
          onValueChange={v => !readOnly && setEfetividadeCombate(v)}
        >
          {['ALTA', 'MEDIA', 'BAIXA'].map(v => (
            <div key={v} className="flex items-center space-x-2">
              <RadioGroupItem value={v} id={`efe-${v}`} disabled={readOnly} />
              <Label htmlFor={`efe-${v}`} className="capitalize cursor-pointer">
                {v === 'ALTA' ? 'Alta' : v === 'MEDIA' ? 'Média' : 'Baixa'}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {submitted && fieldError('efetividade')}
      </div>

      {/* ── Necessidade de Reforço ── */}
      <div className="space-y-4">
        {sectionHeader('Necessidade de Reforço', false)}
        <RadioGroup
          value={necessidadeReforco ? 'sim' : 'nao'}
          onValueChange={v => !readOnly && setNecessidadeReforco(v === 'sim')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sim" id="ref-sim" disabled={readOnly} />
            <Label htmlFor="ref-sim">Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nao" id="ref-nao" disabled={readOnly} />
            <Label htmlFor="ref-nao">Não</Label>
          </div>
        </RadioGroup>

        {necessidadeReforco && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6 border-l-2 border-warning/30">
            {[
              { value: 'TERRESTRE', label: 'Mais equipes terrestres' },
              { value: 'AEREO', label: 'Apoio aéreo' },
              { value: 'MAQUINARIO', label: 'Maquinário pesado' },
              { value: 'SCI', label: 'Implantação do SCI' },
            ].map(r => (
              <div key={r.value} className="flex items-start space-x-2">
                <Checkbox
                  id={`ref-${r.value}`}
                  disabled={readOnly}
                  checked={tiposReforcoNecessarios.includes(r.value)}
                  onCheckedChange={() => !readOnly && toggleSet(r.value, tiposReforcoNecessarios, setTiposReforcoNecessarios)}
                />
                <label htmlFor={`ref-${r.value}`} className="text-sm cursor-pointer">{r.label}</label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Histórico Descritivo ── */}
      <div
        className={sectionClass(!!errors.historico)}
        data-error={submitted && !!errors.historico}
      >
        {sectionHeader('Histórico Descritivo')}
        <Textarea
          placeholder="Descreva de forma livre a atuação, dificuldades encontradas e outras informações relevantes..."
          className={cn('min-h-[120px]', submitted && errors.historico && 'border-destructive')}
          value={historicoDescritivo}
          disabled={readOnly}
          onChange={e => setHistoricoDescritivo(e.target.value)}
        />
        <p className="text-xs text-muted-foreground text-right">{historicoDescritivo.length} caracteres (mín. 20)</p>
        {submitted && fieldError('historico')}
      </div>
      {/* ── Resultado Final ── */}
      <div
        className={sectionClass(!!errors.resultado || !!errors.outroResultado)}
        data-error={submitted && (!!errors.resultado || !!errors.outroResultado)}
      >
        {sectionHeader('Resultado da Ocorrência')}
        <RadioGroup
          value={resultadoOcorrencia}
          onValueChange={v => !readOnly && setResultadoOcorrencia(v)}
          className="flex flex-col gap-3"
        >
          {RESULTADOS.map(r => (
            <div key={r.value} className="flex items-start space-x-2">
              <RadioGroupItem value={r.value} id={`res-${r.value}`} className="mt-1" disabled={readOnly} />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor={`res-${r.value}`} className="cursor-pointer">{r.label}</Label>
                {r.desc && <p className="text-xs text-muted-foreground">{r.desc}</p>}
              </div>
              {r.value === 'OUTRO' && resultadoOcorrencia === 'OUTRO' && (
                <Input
                  className={cn('h-8 flex-1 ml-2', submitted && errors.outroResultado && 'border-destructive')}
                  value={outroResultadoDescricao}
                  disabled={readOnly}
                  onChange={e => setOutroResultadoDescricao(e.target.value)}
                />
              )}
            </div>
          ))}
        </RadioGroup>
        {submitted && resultadoOcorrencia === 'OUTRO' && fieldError('outroResultado')}
        {submitted && !resultadoOcorrencia && fieldError('resultado')}
      </div>

      {/* ── Anexos ── */}
      {!readOnly && (
        <div className="space-y-4">
          {sectionHeader('Anexos e Documentação Visual', false)}
          <FileUploader
            label="Anexar Fotos, Relatórios em PDF, Mapas KML ou Documentos"
            initialUrls={initialData?.anexos?.map((a: any) => a.url) || []}
            onChange={files => onFilesChange && onFilesChange('anexos', files)}
            onRemoveInitial={onFileRemove}
          />
        </div>
      )}
    </form>
  );
}
