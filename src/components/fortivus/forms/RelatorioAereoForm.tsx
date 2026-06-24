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

export function RelatorioAereoForm({ 
  initialData,
  onSubmit, 
  onFilesChange,
  onFileRemove 
}: { 
  initialData?: any,
  onSubmit?: (payload: any) => void, 
  onFilesChange?: (key: string, files: File[]) => void,
  onFileRemove?: (url: string) => void,
  eventoFogoId?: string,
  despachoLat?: number,
  despachoLng?: number
}) {
  const [usoAgua, setUsoAgua] = useState(initialData?.houveUsoAgua || false);
  const [reforco, setReforco] = useState(initialData?.necessidadeReforco || false);
  const [resultado, setResultado] = useState<string>(initialData?.resultadoOcorrencia || 'andamento');
  
  // States for "Outros" inputs
  const [outroAgua, setOutroAgua] = useState(initialData?.origensAgua?.includes('Outro') || false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(
    initialData?.areaAtuacaoLat ? {lat: initialData.areaAtuacaoLat, lng: initialData.areaAtuacaoLng} : null
  );

  const [efetividade, setEfetividade] = useState(initialData?.efetividadeCombate || 'media');

  const handleLocalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const hasEmp = Array.from(form.querySelectorAll('[id^="emp-"]')).some((cb: any) => cb.dataset.state === 'checked');
    const errors = [];
    
    if (!hasEmp) errors.push('Tipo de emprego');

    if (usoAgua) {
      const hasOrigem = Array.from(form.querySelectorAll('[id^="oagua-"]')).some((cb: any) => cb.dataset.state === 'checked');
      if (!hasOrigem) errors.push('Origem da Água');
    }

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
    if (form.querySelector('#emp-indireto[data-state="checked"]')) tiposEmprego.push('Combate indireto');
    if (form.querySelector('#emp-recon[data-state="checked"]')) tiposEmprego.push('Reconhecimento');

    const origensAgua = [];
    if (usoAgua) {
      if (form.querySelector('#oagua-curso[data-state="checked"]')) origensAgua.push('Curso d\'água natural');
      if (form.querySelector('#oagua-hidrante[data-state="checked"]')) origensAgua.push('Hidrante');
      if (form.querySelector('#oagua-fixo[data-state="checked"]')) origensAgua.push('Reservatório fixo');
      if (outroAgua) origensAgua.push('Outro');
    }

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
      horasLiquidas: data.get('horasLiquidas') as string,
      tiposEmprego,
      areaAtuacaoLat: location?.lat || null,
      areaAtuacaoLng: location?.lng || null,
      qtdeLancamentos: data.get('qtdeLancamentos') ? parseInt(data.get('qtdeLancamentos') as string) : null,
      houveUsoAgua: usoAgua,
      volumeAguaLitros: usoAgua && data.get('volumeAguaLitros') ? parseInt(data.get('volumeAguaLitros') as string) : null,
      origensAgua,
      outraOrigemAguaDescricao: outroAgua ? data.get('outraOrigemAguaDescricao') as string : null,
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
    <form id="form-aereo" onSubmit={handleLocalSubmit} className="space-y-8 p-1">
      {/* Tempo de Operação */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Tempo de Operação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Horímetro Inicial</Label>
            <Input type="number" name="horimetroInicial" placeholder="Ex: 1240.5" defaultValue={initialData?.horimetroInicial} step="0.1" />
          </div>
          <div className="space-y-2">
            <Label>Horímetro Final</Label>
            <Input type="number" name="horimetroFinal" placeholder="Ex: 1243.2" defaultValue={initialData?.horimetroFinal} step="0.1" />
          </div>
          <div className="space-y-2">
            <Label>Horas líquidas (HH:MM)</Label>
            <Input type="time" name="horasLiquidas" defaultValue={initialData?.horasLiquidas} />
          </div>
        </div>
      </div>

      {/* Tipo de Emprego */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Tipo de emprego <span className="text-destructive">*</span></h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="emp-direto" defaultChecked={initialData?.tiposEmprego?.includes('Combate direto')} />
            <label htmlFor="emp-direto" className="text-sm font-medium leading-none">Combate direto</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="emp-indireto" defaultChecked={initialData?.tiposEmprego?.includes('Combate indireto')} />
            <label htmlFor="emp-indireto" className="text-sm font-medium leading-none">Combate indireto</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="emp-recon" defaultChecked={initialData?.tiposEmprego?.includes('Reconhecimento')} />
            <label htmlFor="emp-recon" className="text-sm font-medium leading-none">Reconhecimento</label>
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

      {/* Operação com Água */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Operação com Água</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Quantidade de alijamentos realizados</Label>
            <Input type="number" name="qtdeLancamentos" placeholder="Qtd. de lançamentos" defaultValue={initialData?.qtdeLancamentos} />
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <Label>Houve uso de água na ocorrência?</Label>
          <RadioGroup value={usoAgua ? "sim" : "nao"} onValueChange={(v) => setUsoAgua(v === 'sim')} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id="agua-sim" />
              <Label htmlFor="agua-sim">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id="agua-nao" />
              <Label htmlFor="agua-nao">Não</Label>
            </div>
          </RadioGroup>
        </div>

        {usoAgua && (
          <div className="space-y-4 pl-6 border-l-2 border-primary/30 pt-2">
            <div className="space-y-2 max-w-sm">
              <Label>Quantidade (Litros) <span className="text-destructive">*</span></Label>
              <Input type="number" name="volumeAguaLitros" placeholder="Ex: 5000" required={usoAgua} defaultValue={initialData?.volumeAguaLitros} />
            </div>

            <div className="space-y-2 pt-2">
              <Label>Origem da Água <span className="text-destructive">*</span></Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="oagua-curso" defaultChecked={initialData?.origensAgua?.includes("Curso d'água natural")} />
                  <label htmlFor="oagua-curso" className="text-sm font-medium leading-none">Curso d'água natural (rio, lago, represa)</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="oagua-hidrante" defaultChecked={initialData?.origensAgua?.includes("Hidrante")} />
                  <label htmlFor="oagua-hidrante" className="text-sm font-medium leading-none">Hidrante</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="oagua-fixo" defaultChecked={initialData?.origensAgua?.includes("Reservatório fixo")} />
                  <label htmlFor="oagua-fixo" className="text-sm font-medium leading-none">Reservatório fixo (cisterna, caixa d'água)</label>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Checkbox id="oagua-outro" checked={outroAgua} onCheckedChange={(c) => setOutroAgua(!!c)} />
                  <label htmlFor="oagua-outro" className="text-sm font-medium leading-none">Outro:</label>
                  {outroAgua && <Input name="outraOrigemAguaDescricao" placeholder="Descreva" className="h-8 ml-2 flex-1 max-w-[250px]" required defaultValue={initialData?.outraOrigemAguaDescricao} />}
                </div>
              </div>
            </div>
          </div>
        )}
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
          <Textarea name="historicoDescritivo" placeholder="Descreva de forma livre os detalhes da operação aérea..." className="min-h-[120px]" required defaultValue={initialData?.historicoDescritivo} />
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
