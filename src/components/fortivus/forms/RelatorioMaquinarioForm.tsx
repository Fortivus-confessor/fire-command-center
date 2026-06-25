import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import SituationMapClient from '@/components/fortivus/map/SituationMapClient';
import { FileUploader } from '@/components/fortivus/forms/FileUploader';
import { toast } from 'sonner';

export function RelatorioMaquinarioForm({
  initialData,
  onSubmit,
  onFilesChange,
  onFileRemove,
  eventoFogoId,
  despachoLat,
  despachoLng
}: {
  initialData?: any,
  onSubmit?: (payload: any) => void, 
  onFilesChange?: (key: string, files: File[]) => void,
  onFileRemove?: (url: string) => void,
  eventoFogoId?: string,
  despachoLat?: number,
  despachoLng?: number
}) {
  const [reforco, setReforco] = useState(initialData?.necessidadeReforco || false);
  const [resultado, setResultado] = useState<string>(initialData?.resultadoOcorrencia || 'andamento');
  const [empregoAceiro, setEmpregoAceiro] = useState(initialData?.tiposEmprego?.includes('Confecção de aceiros') || false);
  const [empregoOutro, setEmpregoOutro] = useState(initialData?.tiposEmprego?.includes('Outro') || false);
  const [efetividade, setEfetividade] = useState(initialData?.efetividadeCombate || 'media');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(
    initialData?.areaAtuacaoLat ? {lat: initialData.areaAtuacaoLat, lng: initialData.areaAtuacaoLng} : null
  );

  const handleLocalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const hasEmp = Array.from(form.querySelectorAll('[id^="emp-"]')).some((cb: any) => cb.dataset.state === 'checked');
    const errors = [];
    
    if (!hasEmp) errors.push('Tipo de emprego');

    if (reforco) {
      const hasRef = Array.from(form.querySelectorAll('[id^="ref-"]')).some((cb: any) => cb.dataset.state === 'checked');
      if (!hasRef) errors.push('Reforços Necessários');
    }

    if (errors.length > 0) {
      toast.error('Campos obrigatórios incompletos', {
        description: `Selecione pelo menos uma opção nas seguintes categorias: ${errors.join(', ')}`
      });
      return;
    }

    const tiposEmprego = [];
    if (form.querySelector('#emp-direto[data-state="checked"]')) tiposEmprego.push('Combate direto');
    if (form.querySelector('#emp-aceiros[data-state="checked"]')) tiposEmprego.push('Confecção de aceiros');
    if (form.querySelector('#emp-fogo[data-state="checked"]')) tiposEmprego.push('Apoio a fogo contrafogo');
    if (empregoOutro) tiposEmprego.push('Outro');

    const tiposReforco = [];
    if (reforco) {
      if (form.querySelector('#ref-ter[data-state="checked"]')) tiposReforco.push('Mais equipes terrestres');
      if (form.querySelector('#ref-aer[data-state="checked"]')) tiposReforco.push('Apoio aéreo');
      if (form.querySelector('#ref-maq[data-state="checked"]')) tiposReforco.push('Maquinário pesado');
      if (form.querySelector('#ref-sci[data-state="checked"]')) tiposReforco.push('Implantação do SCI');
    }

    const payload = {
      horimetroInicial: data.get('horimetroInicial') ? parseFloat(data.get('horimetroInicial') as string) : null,
      horimetroFinal: data.get('horimetroFinal') ? parseFloat(data.get('horimetroFinal') as string) : null,
      tempoLiquido: data.get('tempoLiquido') as string,
      horaInicioOperacao: data.get('horaInicioOperacao') ? data.get('horaInicioOperacao') + ":00" : null,
      horaFimOperacao: data.get('horaFimOperacao') ? data.get('horaFimOperacao') + ":00" : null,
      tiposEmprego,
      comprimentoAceiros: empregoAceiro && data.get('comprimentoAceiros') ? parseFloat(data.get('comprimentoAceiros') as string) : null,
      descricaoOutroEmprego: empregoOutro ? data.get('descricaoOutroEmprego') as string : null,
      areaAtuacaoLat: location?.lat || null,
      areaAtuacaoLng: location?.lng || null,
      efetividadeCombate: efetividade,
      necessidadeReforco: reforco,
      tiposReforcoNecessarios: tiposReforco,
      historicoDescritivo: data.get('historicoDescritivo') as string,
      resultadoOcorrencia: resultado,
      outroResultadoDescricao: resultado === 'outro' ? data.get('outroResultadoDescricao') as string : null,
    };

    if (onSubmit) onSubmit(payload);
  };

  return (
    <form id="form-maquinario" onSubmit={handleLocalSubmit} className="space-y-8 p-1">
      {/* Tempo de Operação */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Tempo de Operação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Horímetro Inicial</Label>
            <Input type="number" name="horimetroInicial" placeholder="Ex: 5400.5" defaultValue={initialData?.horimetroInicial} step="0.1" />
          </div>
          <div className="space-y-2">
            <Label>Horímetro Final</Label>
            <Input type="number" name="horimetroFinal" placeholder="Ex: 5408.2" defaultValue={initialData?.horimetroFinal} step="0.1" />
          </div>
          <div className="space-y-2">
            <Label>Tempo líquido (HH:MM)</Label>
            <Input type="time" name="tempoLiquido" defaultValue={initialData?.tempoLiquido} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <Label>Horário de início da operação</Label>
            <Input type="time" name="horaInicioOperacao" defaultValue={initialData?.horaInicioOperacao?.substring(0, 5)} />
          </div>
          <div className="space-y-2">
            <Label>Horário final da operação</Label>
            <Input type="time" name="horaFimOperacao" defaultValue={initialData?.horaFimOperacao?.substring(0, 5)} />
          </div>
        </div>
      </div>

      {/* Tipo de Emprego */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Tipo de emprego <span className="text-destructive">*</span></h3>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="emp-direto" defaultChecked={initialData?.tiposEmprego?.includes('Combate direto')} />
              <label htmlFor="emp-direto" className="text-sm font-medium leading-none">Combate direto</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="emp-aceiros" checked={empregoAceiro} onCheckedChange={(c) => setEmpregoAceiro(!!c)} />
              <label htmlFor="emp-aceiros" className="text-sm font-medium leading-none">Confecção de aceiros</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="emp-fogo" defaultChecked={initialData?.tiposEmprego?.includes('Apoio a fogo contrafogo')} />
              <label htmlFor="emp-fogo" className="text-sm font-medium leading-none">Apoio a fogo contrafogo</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="emp-outro" checked={empregoOutro} onCheckedChange={(c) => setEmpregoOutro(!!c)} />
              <label htmlFor="emp-outro" className="text-sm font-medium leading-none">Outro</label>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            {empregoAceiro && (
              <div className="space-y-2 flex-1 max-w-xs">
                <Label>Comprimento dos aceiros construídos (m) <span className="text-destructive">*</span></Label>
                <Input type="number" name="comprimentoAceiros" placeholder="Ex: 500" required={empregoAceiro} defaultValue={initialData?.comprimentoAceiros} step="0.1" />
              </div>
            )}
            {empregoOutro && (
              <div className="space-y-2 flex-1 max-w-xs">
                <Label>Descrição do Outro emprego</Label>
                <Input name="descricaoOutroEmprego" placeholder="Descreva..." required defaultValue={initialData?.descricaoOutroEmprego} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Área de Atuação */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Área de Atuação da Equipe</h3>
        <div className="relative rounded-lg overflow-hidden border border-border h-[350px]">
          <SituationMapClient 
             hideEvents={!eventoFogoId}
             isolatedEventId={eventoFogoId}
             dispatchPin={despachoLat && despachoLng ? { lat: despachoLat, lng: despachoLng } : null}
             activePin={location ? { lat: location.lat, lng: location.lng } : null}
             onClickMap={(lat, lng) => setLocation({lat, lng})}
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
      </div>

      {/* Efetividade e Reforço */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Avaliação e Necessidades</h3>
        
        <div className="space-y-3">
          <Label>Efetividade estimada</Label>
          <RadioGroup value={efetividade} onValueChange={setEfetividade} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="alta" id="ef-alta" />
              <Label htmlFor="ef-alta">Alta</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="media" id="ef-media" />
              <Label htmlFor="ef-media">Média</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="baixa" id="ef-baixa" />
              <Label htmlFor="ef-baixa">Baixa</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3 pt-4">
          <Label>Necessidade de reforço?</Label>
          <RadioGroup value={reforco ? "sim" : "nao"} onValueChange={(v) => setReforco(v === 'sim')} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id="ref-sim" />
              <Label htmlFor="ref-sim">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id="ref-nao" />
              <Label htmlFor="ref-nao">Não</Label>
            </div>
          </RadioGroup>
        </div>

        {reforco && (
          <div className="space-y-3 pl-6 border-l-2 border-warning/30 pt-2">
            <Label className="text-muted-foreground">Selecione os reforços necessários: <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="ref-ter" defaultChecked={initialData?.tiposReforcoNecessarios?.includes("Mais equipes terrestres")} />
                <label htmlFor="ref-ter" className="text-sm leading-none">Mais equipes terrestres</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="ref-aer" defaultChecked={initialData?.tiposReforcoNecessarios?.includes("Apoio aéreo")} />
                <label htmlFor="ref-aer" className="text-sm leading-none">Apoio aéreo</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="ref-maq" defaultChecked={initialData?.tiposReforcoNecessarios?.includes("Maquinário pesado")} />
                <label htmlFor="ref-maq" className="text-sm leading-none">Maquinário pesado</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="ref-sci" defaultChecked={initialData?.tiposReforcoNecessarios?.includes("Implantação do SCI")} />
                <label htmlFor="ref-sci" className="text-sm leading-none">Implantação do SCI</label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Histórico e Resultado */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Histórico e Resultado</h3>
        
        <div className="space-y-2">
          <Label>Histórico descritivo <span className="text-destructive">*</span></Label>
          <Textarea name="historicoDescritivo" placeholder="Descreva de forma livre os detalhes da operação com maquinário..." className="min-h-[120px]" required defaultValue={initialData?.historicoDescritivo} />
        </div>

        <div className="space-y-3 pt-2">
          <Label>Resultado da ocorrência</Label>
          <RadioGroup value={resultado} onValueChange={setResultado} className="space-y-3">
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="andamento" id="res-and" className="mt-0.5" />
              <Label htmlFor="res-and" className="leading-tight">
                Em andamento <span className="text-muted-foreground font-normal">(Combate ativo no momento do preenchimento, sem extinção total.)</span>
              </Label>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="extinto" id="res-ext" className="mt-0.5" />
              <Label htmlFor="res-ext" className="leading-tight">
                Incêndio extinto pela agência / Resolvida <span className="text-muted-foreground font-normal">(Equipe concluiu o combate e confirmou extinção completa do fogo.)</span>
              </Label>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="outro" id="res-out" className="mt-0.5" />
              <Label htmlFor="res-out" className="leading-tight whitespace-nowrap">Outro:</Label>
              {resultado === 'outro' && <Input name="outroResultadoDescricao" className="h-7 text-xs flex-1 ml-2 max-w-[300px]" placeholder="Especifique..." required defaultValue={initialData?.outroResultadoDescricao} />}
            </div>
          </RadioGroup>
        </div>
      </div>
      
      {/* Anexos */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Anexos e Documentação Visual</h3>
        <FileUploader 
          label="Anexar Fotos, Relatórios em PDF, Mapas KML ou Documentos" 
          initialUrls={initialData?.anexos?.map((a: any) => a.url) || []}
          onChange={(files) => onFilesChange && onFilesChange('anexos', files)}
          onRemoveInitial={onFileRemove}
        />
      </div>
    </form>
  );
}
