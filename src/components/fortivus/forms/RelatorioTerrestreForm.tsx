import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MapPin, Plus, Trash2, Camera } from 'lucide-react';
import { LocationPickerMap } from '@/components/fortivus/map/LocationPickerMap';
import { FileUploader } from '@/components/fortivus/forms/FileUploader';
import { toast } from 'sonner';

export function RelatorioTerrestreForm({ onSubmit, onFilesChange }: { onSubmit?: (e: React.FormEvent) => void, onFilesChange?: (key: string, files: File[]) => void }) {
  const [agua, setAgua] = useState(false);
  const [apoioRurais, setApoioRurais] = useState(false);
  const [recusaRurais, setRecusaRurais] = useState(false);
  const [necessidadeReforco, setNecessidadeReforco] = useState(false);
  
  // States for "Outros" inputs
  const [outrosOrgaos, setOutrosOrgaos] = useState(false);
  const [outraOrigem, setOutraOrigem] = useState(false);
  const [resultado, setResultado] = useState<string>('andamento');
  const [outroAgua, setOutroAgua] = useState(false);

  const acoes = [
    'Reconhecimento e Planejamento', 'Combate a Incêndio florestal direto',
    'Confecção de aceiro manual', 'Confecção de aceiro mecânico com apoio de terceiros',
    'Realização de fogo contrafogo', 'Vigilância', 'Rescaldo', 'Nenhuma ação foi executada'
  ];

  const orgaos = [
    'Exército Brasileiro', 'Força Aérea do Brasil', 'Marinha do Brasil', 'Polícia Militar',
    'ICMBio', 'Ibama', 'SINFRA', 'SEMA', 'Defesa Civil Estadual', 'Prefeitura Municipal',
    'Outros', 'Nenhum órgão de Apoio'
  ];

  const materiais = [
    'Soprador costal', 'Kit Combat', 'Motosserra', 'Mochila costal',
    'Motobomba', 'Foice', 'Roçadeira', 'Enxada', 'Rastelo', 'Mcleod (enxada + rastelo)',
    'Gorgui (picareta + enxada + rastelo)', 'Pulaski (machado + enxada)',
    'Abafador', 'Pinga fogo', 'Drone', 'Nenhum'
  ];

  const origens = [
    'Raio (descarga elétrica atmosférica)', 'Queimada ilegal de lixo e folhas',
    'Queima ilegal de material lenhoso enleirado', 'Acidente veicular',
    'Ação intencional (incendiário / criminosa)', 'Atividade extrativista (carvão, mel, coleta, etc.)',
    'Problemas na rede elétrica (curto circuito, cabo rompido, transformador, etc.)',
    'Sem indícios da possível causa', 'Outros'
  ];

  const [propriedadesApoio, setPropriedadesApoio] = useState([{ id: 1, maq: false, mao: false, outro: false, mapOpen: false }]);
  const [propriedadesRecusa, setPropriedadesRecusa] = useState([{ id: 1, outro: false, mapOpen: false }]);

  const handleLocalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    const hasAcao = Array.from(form.querySelectorAll('[id^="acao-"]')).some((cb: any) => cb.dataset.state === 'checked');
    const hasOrgao = Array.from(form.querySelectorAll('[id^="orgao-"]')).some((cb: any) => cb.dataset.state === 'checked');
    const hasMaterial = Array.from(form.querySelectorAll('[id^="mat-"]')).some((cb: any) => cb.dataset.state === 'checked');

    const errors = [];
    if (!hasAcao) errors.push('Ações de Combate Realizadas');
    if (!hasOrgao) errors.push('Órgãos de Apoio');
    if (!hasMaterial) errors.push('Materiais Utilizados');

    if (errors.length > 0) {
      toast.error('Campos obrigatórios incompletos', {
        description: `Selecione pelo menos uma opção nas seguintes categorias: ${errors.join(', ')}`
      });
      return;
    }

    if (onSubmit) onSubmit(e);
  };

  return (
    <form id="form-terrestre" onSubmit={handleLocalSubmit} className="space-y-8 p-1">
      {/* Ações Realizadas */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Ações de Combate Realizadas <span className="text-destructive">*</span></h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {acoes.map(a => (
            <div key={a} className="flex items-start space-x-2">
              <Checkbox id={`acao-${a}`} />
              <label htmlFor={`acao-${a}`} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{a}</label>
            </div>
          ))}
        </div>
      </div>

      {/* Órgãos de Apoio */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Órgãos de Apoio <span className="text-destructive">*</span></h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {orgaos.map(o => (
            <div key={o} className="flex items-start space-x-2">
              <Checkbox 
                id={`orgao-${o}`} 
                onCheckedChange={(c) => {
                  if (o === 'Outros') setOutrosOrgaos(!!c);
                }} 
              />
              <label htmlFor={`orgao-${o}`} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{o}</label>
            </div>
          ))}
        </div>
        {outrosOrgaos && (
          <Input placeholder="Descreva os outros órgãos..." className="mt-2" required />
        )}
      </div>

      {/* Mapa de Atuação */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Área de Atuação da Guarnição</h3>
        <div className="relative rounded-lg overflow-hidden border border-border">
          <LocationPickerMap height="300px" />
          <div className="absolute top-4 left-4 z-[400] flex gap-2 pointer-events-none">
            <div className="bg-background/80 backdrop-blur-sm border border-border text-xs px-2 py-1 rounded flex items-center gap-1 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-command"></div> Despacho Original
            </div>
            <div className="bg-background/80 backdrop-blur-sm border border-border text-xs px-2 py-1 rounded flex items-center gap-1 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-fire"></div> Local de Atuação
            </div>
          </div>
        </div>
      </div>

      {/* Materiais Utilizados */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Materiais Utilizados <span className="text-destructive">*</span></h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {materiais.map(m => (
            <div key={m} className="flex items-start space-x-2">
              <Checkbox id={`mat-${m}`} />
              <label htmlFor={`mat-${m}`} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{m}</label>
            </div>
          ))}
        </div>
      </div>

      {/* Uso de Água */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Uso de Água na Ocorrência <span className="text-destructive">*</span></h3>
        <RadioGroup value={agua ? "sim" : "nao"} onValueChange={(v) => setAgua(v === 'sim')} className="flex gap-4" required>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sim" id="agua-sim" />
            <Label htmlFor="agua-sim">Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nao" id="agua-nao" />
            <Label htmlFor="agua-nao">Não</Label>
          </div>
        </RadioGroup>

        {agua && (
          <div className="grid gap-4 pl-6 border-l-2 border-primary/20">
            <div className="space-y-2">
              <Label>Quantidade (Litros)</Label>
              <Input type="number" placeholder="Ex: 5000" required />
            </div>
            <div className="space-y-2">
              <Label>Origem da Água</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="agua-curso" />
                  <label htmlFor="agua-curso" className="text-sm font-medium leading-none">Curso d'água natural (rio, lago, represa)</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="agua-hidrante" />
                  <label htmlFor="agua-hidrante" className="text-sm font-medium leading-none">Hidrante</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="agua-fixo" />
                  <label htmlFor="agua-fixo" className="text-sm font-medium leading-none">Reservatório fixo (cisterna, caixa d'água)</label>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Checkbox id="agua-outro" onCheckedChange={(c) => setOutroAgua(!!c)} />
                  <label htmlFor="agua-outro" className="text-sm font-medium leading-none">Outro:</label>
                  {outroAgua && <Input placeholder="Descreva" className="h-8 ml-2 flex-1 max-w-[200px]" required />}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Apoio Rural */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Apoio de Propriedades Rurais <span className="text-destructive">*</span></h3>
        <RadioGroup value={apoioRurais ? "sim" : "nao"} onValueChange={(v) => setApoioRurais(v === 'sim')} className="flex gap-4" required>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sim" id="apoio-sim" />
            <Label htmlFor="apoio-sim">Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nao" id="apoio-nao" />
            <Label htmlFor="apoio-nao">Não</Label>
          </div>
        </RadioGroup>

        {apoioRurais && (
          <div className="space-y-4 pl-6 border-l-2 border-success/30">
            {propriedadesApoio.map((p, index) => (
              <div key={p.id} className="glass p-4 rounded-lg space-y-3 relative">
                {propriedadesApoio.length > 1 && (
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-destructive" onClick={() => setPropriedadesApoio(prev => prev.filter(x => x.id !== p.id))}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
                <div className="space-y-1">
                  <Label>Nome da propriedade</Label>
                  <Input placeholder="Fazenda Esperança" required />
                </div>
                <Button variant="outline" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => setPropriedadesApoio(prev => prev.map(x => x.id === p.id ? { ...x, mapOpen: !x.mapOpen } : x))}>
                  <MapPin className="h-4 w-4 mr-2" /> {p.mapOpen ? 'Ocultar mapa' : 'Inserir localização no mapa'}
                </Button>
                {p.mapOpen && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-border">
                    <LocationPickerMap height="200px" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Responsável</Label>
                    <Input required />
                  </div>
                  <div className="space-y-1">
                    <Label>Telefone</Label>
                    <Input placeholder="(XX) XXXXX-XXXX" required />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Label>Tipo de apoio</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox id={`apoio-maq-${p.id}`} checked={p.maq} onCheckedChange={(checked) => setPropriedadesApoio(prev => prev.map(x => x.id === p.id ? { ...x, maq: !!checked } : x))} />
                      <Label htmlFor={`apoio-maq-${p.id}`}>Maquinário</Label>
                      {p.maq && <Input placeholder="Qtd." className="h-6 w-20 text-xs ml-auto" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id={`apoio-mao-${p.id}`} checked={p.mao} onCheckedChange={(checked) => setPropriedadesApoio(prev => prev.map(x => x.id === p.id ? { ...x, mao: !!checked } : x))} />
                      <Label htmlFor={`apoio-mao-${p.id}`}>Mão de obra</Label>
                      {p.mao && <Input placeholder="Qtd." className="h-6 w-20 text-xs ml-auto" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id={`apoio-outro-${p.id}`} checked={p.outro} onCheckedChange={(checked) => setPropriedadesApoio(prev => prev.map(x => x.id === p.id ? { ...x, outro: !!checked } : x))} />
                      <Label htmlFor={`apoio-outro-${p.id}`}>Outro</Label>
                      {p.outro && <Input placeholder="Descreva" className="h-6 flex-1 text-xs ml-2" required />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setPropriedadesApoio(prev => [...prev, { id: Date.now(), maq: false, mao: false, outro: false, mapOpen: false }])} className="text-xs">
              <Plus className="h-3 w-3 mr-1" /> Adicionar outra propriedade
            </Button>
          </div>
        )}
      </div>

      {/* Recusa Rural */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Recusa de Colaboração <span className="text-destructive">*</span></h3>
        <p className="text-xs text-muted-foreground">Algum proprietário rural se recusou a colaborar com a operação de combate?</p>
        <RadioGroup value={recusaRurais ? "sim" : "nao"} onValueChange={(v) => setRecusaRurais(v === 'sim')} className="flex gap-4" required>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sim" id="recusa-sim" />
            <Label htmlFor="recusa-sim">Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nao" id="recusa-nao" />
            <Label htmlFor="recusa-nao">Não</Label>
          </div>
        </RadioGroup>

        {recusaRurais && (
          <div className="space-y-4 pl-6 border-l-2 border-destructive/30">
            {propriedadesRecusa.map((p, index) => (
              <div key={p.id} className="glass p-4 rounded-lg space-y-3 relative">
                {propriedadesRecusa.length > 1 && (
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-destructive" onClick={() => setPropriedadesRecusa(prev => prev.filter(x => x.id !== p.id))}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
                <div className="space-y-1">
                  <Label>Nome da propriedade</Label>
                  <Input />
                </div>
                <Button variant="outline" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => setPropriedadesRecusa(prev => prev.map(x => x.id === p.id ? { ...x, mapOpen: !x.mapOpen } : x))}>
                  <MapPin className="h-4 w-4 mr-2" /> {p.mapOpen ? 'Ocultar mapa' : 'Inserir localização no mapa'}
                </Button>
                {p.mapOpen && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-border">
                    <LocationPickerMap height="200px" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Responsável (se conhecido)</Label>
                    <Input />
                  </div>
                  <div className="space-y-1">
                    <Label>Telefone</Label>
                    <Input />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Label>Descrição da recusa</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      'Não autorizou passagem pela propriedade',
                      'Recusou fornecimento de água',
                      'Não disponibilizou recursos disponíveis',
                      'Se recusou a combater o incêndio',
                      'Se recusou a atender as recomendações da agência',
                      'Realizou fogo contrafogo de maneira desordenada',
                    ].map(r => (
                      <div key={r} className="flex items-start space-x-2">
                        <Checkbox id={`recusa-tipo-${p.id}-${r}`} />
                        <label htmlFor={`recusa-tipo-${p.id}-${r}`} className="text-xs leading-none">{r}</label>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2 mt-1">
                      <Checkbox id={`recusa-outro-${p.id}`} checked={p.outro} onCheckedChange={(checked) => setPropriedadesRecusa(prev => prev.map(x => x.id === p.id ? { ...x, outro: !!checked } : x))} />
                      <Label htmlFor={`recusa-outro-${p.id}`} className="text-xs">Outro:</Label>
                      {p.outro && <Input className="h-6 flex-1 text-xs ml-2" required />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setPropriedadesRecusa(prev => [...prev, { id: Date.now(), outro: false, mapOpen: false }])} className="text-xs">
              <Plus className="h-3 w-3 mr-1" /> Adicionar outra propriedade
            </Button>
          </div>
        )}
      </div>

      {/* Origem e Imagens */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Possível Origem do Incêndio <span className="text-destructive">*</span></h3>
          <RadioGroup className="grid grid-cols-1 sm:grid-cols-2 gap-3" required onValueChange={(v) => setOutraOrigem(v === 'Outros')}>
          {origens.map(o => (
            <div key={o} className="flex items-start space-x-2">
              <RadioGroupItem value={o} id={`origem-${o}`} className="mt-0.5" />
              <Label htmlFor={`origem-${o}`} className="text-sm font-normal leading-tight">{o}</Label>
            </div>
          ))}
        </RadioGroup>
        {outraOrigem && (
          <Input placeholder="Descreva a outra origem..." className="mt-2" required />
        )}
        <div className="pt-2">
          <FileUploader 
            label="Adicionar imagem do local de origem (com coordenadas)" 
            maxFiles={1} 
            accept=".png,.jpg,.jpeg" 
            onChange={(files) => onFilesChange && onFilesChange('origem', files)}
          />
        </div>
      </div>

      {/* Efetividade */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Efetividade Estimada <span className="text-destructive">*</span></h3>
        <RadioGroup className="flex gap-6" required>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="alta" id="efe-alta" />
            <Label htmlFor="efe-alta">Alta</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="media" id="efe-media" />
            <Label htmlFor="efe-media">Média</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="baixa" id="efe-baixa" />
            <Label htmlFor="efe-baixa">Baixa</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Reforço */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Necessidade de Reforço</h3>
        <RadioGroup value={necessidadeReforco ? "sim" : "nao"} onValueChange={(v) => setNecessidadeReforco(v === 'sim')} className="flex gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sim" id="ref-sim" />
            <Label htmlFor="ref-sim">Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nao" id="ref-nao" />
            <Label htmlFor="ref-nao">Não</Label>
          </div>
        </RadioGroup>

        {necessidadeReforco && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6 border-l-2 border-warning/30">
            <div className="flex items-start space-x-2">
              <Checkbox id="ref-guarnicoes" />
              <label htmlFor="ref-guarnicoes" className="text-sm">Mais guarnições terrestres</label>
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox id="ref-aereo" />
              <label htmlFor="ref-aereo" className="text-sm">Apoio aéreo</label>
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox id="ref-maquinario" />
              <label htmlFor="ref-maquinario" className="text-sm">Maquinário pesado</label>
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox id="ref-sci" />
              <label htmlFor="ref-sci" className="text-sm">Implantação do SCI</label>
            </div>
          </div>
        )}
      </div>

      {/* Histórico */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Histórico Descritivo <span className="text-destructive">*</span></h3>
        <Textarea placeholder="Descreva de forma livre a atuação, dificuldades encontradas e outras informações relevantes..." className="min-h-[120px]" required />
      </div>

      {/* Resultado Final */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Resultado da Ocorrência <span className="text-destructive">*</span></h3>
        <RadioGroup value={resultado} onValueChange={setResultado} className="flex flex-col gap-3" required>
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="andamento" id="res-andamento" className="mt-1" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="res-andamento">Em andamento</Label>
              <p className="text-xs text-muted-foreground">Combate ativo no momento do preenchimento, sem extinção total.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="fiscalizacao" id="res-fiscalizacao" className="mt-1" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="res-fiscalizacao">Necessidade de emprego de equipe de fiscalização</Label>
              <p className="text-xs text-muted-foreground">Ex: queima controlada ou intencional, fogo já extinto, situação monitorada.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="sem-intervencao" id="res-sem-intervencao" className="mt-1" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="res-sem-intervencao">Sem necessidade de intervenção</Label>
              <p className="text-xs text-muted-foreground">Incêndio extinto sozinho ou por terceiros antes da chegada da guarnição.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="extinto" id="res-extinto" className="mt-1" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="res-extinto">Incêndio extinto / Resolvida</Label>
              <p className="text-xs text-muted-foreground">Guarnição concluiu o combate e confirmou extinção completa do fogo.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="incorreto" id="res-incorreto" className="mt-1" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="res-incorreto">Despacho incorreto</Label>
              <p className="text-xs text-muted-foreground">Não foi encontrado nenhum incêndio ou queimada nas imediações.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="outro" id="res-outro" />
            <Label htmlFor="res-outro">Outro:</Label>
            {resultado === 'outro' && <Input className="h-8 flex-1" required />}
          </div>
        </RadioGroup>
      </div>

      {/* Anexos */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Anexos e Documentação Visual</h3>
        <FileUploader 
          label="Anexar Fotos, Relatórios em PDF, Mapas KML ou Documentos" 
          onChange={(files) => onFilesChange && onFilesChange('anexos', files)}
        />
      </div>

    </form>
  );
}
