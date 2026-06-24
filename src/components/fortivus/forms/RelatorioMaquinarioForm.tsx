import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LocationPickerMap } from '@/components/fortivus/map/LocationPickerMap';
import { FileUploader } from '@/components/fortivus/forms/FileUploader';
import { toast } from 'sonner';

export function RelatorioMaquinarioForm({ 
  initialData,
  onSubmit, 
  onFilesChange,
  onFileRemove 
}: { 
  initialData?: any,
  onSubmit?: (e: React.FormEvent) => void, 
  onFilesChange?: (key: string, files: File[]) => void,
  onFileRemove?: (url: string) => void
}) {
  const [reforco, setReforco] = useState(false);
  const [resultado, setResultado] = useState<string>('andamento');
  const [empregoAceiro, setEmpregoAceiro] = useState(false);
  const [empregoOutro, setEmpregoOutro] = useState(false);

  const handleLocalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

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

    if (onSubmit) onSubmit(e);
  };

  return (
    <form id="form-maquinario" onSubmit={handleLocalSubmit} className="space-y-8 p-1">
      {/* Tempo de Operação */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Tempo de Operação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Horímetro Inicial</Label>
            <Input type="number" placeholder="Ex: 5400.5" />
          </div>
          <div className="space-y-2">
            <Label>Horímetro Final</Label>
            <Input type="number" placeholder="Ex: 5408.2" />
          </div>
          <div className="space-y-2">
            <Label>Tempo líquido (HH:MM)</Label>
            <Input type="time" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <Label>Horário de início da operação</Label>
            <Input type="time" />
          </div>
          <div className="space-y-2">
            <Label>Horário final da operação</Label>
            <Input type="time" />
          </div>
        </div>
      </div>

      {/* Tipo de Emprego */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Tipo de emprego <span className="text-destructive">*</span></h3>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="emp-direto" />
              <label htmlFor="emp-direto" className="text-sm font-medium leading-none">Combate direto</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="emp-aceiros" checked={empregoAceiro} onCheckedChange={(c) => setEmpregoAceiro(!!c)} />
              <label htmlFor="emp-aceiros" className="text-sm font-medium leading-none">Confecção de aceiros</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="emp-fogo" />
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
                <Input type="number" placeholder="Ex: 500" required={empregoAceiro} />
              </div>
            )}
            {empregoOutro && (
              <div className="space-y-2 flex-1 max-w-xs">
                <Label>Descrição do Outro emprego</Label>
                <Input placeholder="Descreva..." required />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Área de Atuação */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Área de Atuação da Equipe</h3>
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

      {/* Efetividade e Reforço */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Avaliação e Necessidades</h3>
        
        <div className="space-y-3">
          <Label>Efetividade estimada</Label>
          <RadioGroup defaultValue="media" className="flex gap-4">
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
                <Checkbox id="ref-ter" />
                <label htmlFor="ref-ter" className="text-sm leading-none">Mais equipes terrestres</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="ref-aer" />
                <label htmlFor="ref-aer" className="text-sm leading-none">Apoio aéreo</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="ref-maq" />
                <label htmlFor="ref-maq" className="text-sm leading-none">Maquinário pesado</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="ref-sci" />
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
          <Textarea placeholder="Descreva de forma livre os detalhes da operação com maquinário..." className="min-h-[120px]" required />
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
              {resultado === 'outro' && <Input className="h-7 text-xs flex-1 ml-2 max-w-[300px]" placeholder="Especifique..." required />}
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
