import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SituationMapClient from "@/components/fortivus/map/SituationMapClient";
import { FileUploader } from "@/components/fortivus/forms/FileUploader";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationErrors {
  horimetroIni?: string;
  horimetroFim?: string;
  horasLiq?: string;
  emprego?: string;
  usoAgua?: string;
  volumeAgua?: string;
  origemAgua?: string;
  efetividade?: string;
  necessidadeReforco?: string;
  reforcos?: string;
  historico?: string;
  resultado?: string;
}

export function RelatorioAereoForm({
  initialData,
  onSubmit,
  onFilesChange,
  onFileRemove,
  eventoFogoId,
  despachoLat,
  despachoLng,
  fireEventLat,
  fireEventLng,
}: {
  initialData?: any;
  onSubmit?: (payload: any) => void;
  onFilesChange?: (key: string, files: File[]) => void;
  onFileRemove?: (url: string) => void;
  eventoFogoId?: string;
  despachoLat?: number;
  despachoLng?: number;
  fireEventLat?: number;
  fireEventLng?: number;
}) {
  const [horInicial, setHorInicial] = useState<string>(
    initialData?.horimetroInicial?.toString() || "",
  );
  const [horFinal, setHorFinal] = useState<string>(initialData?.horimetroFinal?.toString() || "");
  const [horasLiquidas, setHorasLiquidas] = useState<string>(initialData?.horasLiquidas || "");

  const [usoAgua, setUsoAgua] = useState<boolean | undefined>(
    initialData?.houveUsoAgua !== undefined ? initialData?.houveUsoAgua : undefined,
  );
  const [reforco, setReforco] = useState<boolean | undefined>(
    initialData?.necessidadeReforco !== undefined ? initialData?.necessidadeReforco : undefined,
  );
  const [resultado, setResultado] = useState<string>(initialData?.resultadoOcorrencia || "");
  const [efetividade, setEfetividade] = useState<string>(initialData?.efetividadeCombate || "");

  // States for "Outros" inputs
  const [outroAgua, setOutroAgua] = useState(initialData?.origensAgua?.includes("Outro") || false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialData?.areaAtuacaoLat
      ? { lat: initialData.areaAtuacaoLat, lng: initialData.areaAtuacaoLng }
      : null,
  );

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const fieldError = (field: keyof ValidationErrors) =>
    errors[field] ? (
      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3" /> {errors[field]}
      </p>
    ) : null;

  const handleLocalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    const form = e.currentTarget;
    const data = new FormData(form);

    const hasEmp = Array.from(form.querySelectorAll('[id^="emp-"]')).some(
      (cb: any) => cb.dataset.state === "checked",
    );
    const errs: ValidationErrors = {};

    if (!horInicial) errs.horimetroIni = "Obrigatório.";
    if (!horFinal) errs.horimetroFim = "Obrigatório.";
    if (horInicial && horFinal && parseFloat(horFinal) < parseFloat(horInicial)) {
      errs.horimetroFim = "Final não pode ser menor que o Inicial.";
    }
    if (!horasLiquidas) errs.horasLiq = "Obrigatório.";
    if (!hasEmp) errs.emprego = "Selecione pelo menos um tipo de emprego.";

    if (usoAgua === undefined) errs.usoAgua = "Selecione se houve uso de água.";
    if (usoAgua === true) {
      if (!data.get("volumeAguaLitros")) errs.volumeAgua = "Obrigatório.";
      const hasOrigem = Array.from(form.querySelectorAll('[id^="oagua-"]')).some(
        (cb: any) => cb.dataset.state === "checked",
      );
      if (!hasOrigem) errs.origemAgua = "Selecione a origem da água.";
    }

    if (!efetividade) errs.efetividade = "Obrigatório.";
    if (reforco === undefined)
      errs.necessidadeReforco = "Selecione se houve necessidade de reforço.";
    if (reforco === true) {
      const hasRef = Array.from(form.querySelectorAll('[id^="ref-"]')).some(
        (cb: any) => cb.dataset.state === "checked",
      );
      if (!hasRef) errs.reforcos = "Selecione pelo menos um reforço.";
    }

    const hist = data.get("historicoDescritivo") as string;
    if (!hist || hist.trim().length < 10) errs.historico = "Mínimo de 10 caracteres.";

    if (!resultado) errs.resultado = "Obrigatório.";

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      toast.error("Formulário incompleto", {
        description: "Corrija os campos em vermelho antes de continuar.",
      });
      const firstError = document.querySelector('[data-error="true"]');
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const tiposEmprego = [];
    if (form.querySelector('#emp-direto[data-state="checked"]'))
      tiposEmprego.push("Combate direto");
    if (form.querySelector('#emp-indireto[data-state="checked"]'))
      tiposEmprego.push("Combate indireto");
    if (form.querySelector('#emp-recon[data-state="checked"]')) tiposEmprego.push("Reconhecimento");

    const origensAgua = [];
    if (usoAgua) {
      if (form.querySelector('#oagua-curso[data-state="checked"]'))
        origensAgua.push("Curso d'água natural");
      if (form.querySelector('#oagua-hidrante[data-state="checked"]')) origensAgua.push("Hidrante");
      if (form.querySelector('#oagua-fixo[data-state="checked"]'))
        origensAgua.push("Reservatório fixo");
      if (outroAgua) origensAgua.push("Outro");
    }

    const tiposReforco = [];
    if (reforco) {
      if (form.querySelector('#ref-ter[data-state="checked"]'))
        tiposReforco.push("Mais equipes terrestres");
      if (form.querySelector('#ref-aer[data-state="checked"]')) tiposReforco.push("Apoio aéreo");
      if (form.querySelector('#ref-maq[data-state="checked"]'))
        tiposReforco.push("Maquinário pesado");
      if (form.querySelector('#ref-sci[data-state="checked"]'))
        tiposReforco.push("Implantação do SCI");
    }

    const payload = {
      horimetroInicial: parseFloat(horInicial),
      horimetroFinal: parseFloat(horFinal),
      horasLiquidas,
      tiposEmprego,
      areaAtuacaoLat: location?.lat || null,
      areaAtuacaoLng: location?.lng || null,
      qtdeLancamentos: data.get("qtdeLancamentos")
        ? parseInt(data.get("qtdeLancamentos") as string)
        : null,
      houveUsoAgua: usoAgua,
      volumeAguaLitros:
        usoAgua && data.get("volumeAguaLitros")
          ? parseInt(data.get("volumeAguaLitros") as string)
          : null,
      origensAgua,
      outraOrigemAguaDescricao: outroAgua ? (data.get("outraOrigemAguaDescricao") as string) : null,
      efetividadeCombate: efetividade,
      necessidadeReforco: reforco,
      tiposReforcoNecessarios: tiposReforco,
      historicoDescritivo: hist,
      resultadoOcorrencia: resultado,
      outroResultadoDescricao:
        resultado === "outro" ? (data.get("outroResultadoDescricao") as string) : null,
    };

    if (onSubmit) onSubmit(payload);
  };

  const sectionClass = (hasError: boolean) =>
    cn(
      "space-y-4",
      hasError && submitted ? "p-4 rounded-lg border border-destructive/50 bg-destructive/5" : "",
    );

  return (
    <form id="form-aereo" onSubmit={handleLocalSubmit} className="space-y-8 p-1" noValidate>
      {/* Tempo de Operação */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          Tempo de Operação
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2" data-error={submitted && !!errors.horimetroIni}>
            <Label>
              Horímetro Inicial <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              name="horimetroInicial"
              placeholder="Ex: 1240.5"
              value={horInicial}
              onChange={(e) => setHorInicial(e.target.value)}
              step="0.1"
              className={cn(submitted && errors.horimetroIni && "border-destructive")}
            />
            {submitted && fieldError("horimetroIni")}
          </div>
          <div className="space-y-2" data-error={submitted && !!errors.horimetroFim}>
            <Label>
              Horímetro Final <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              name="horimetroFinal"
              placeholder="Ex: 1243.2"
              value={horFinal}
              onChange={(e) => setHorFinal(e.target.value)}
              step="0.1"
              className={cn(submitted && errors.horimetroFim && "border-destructive")}
            />
            {submitted && fieldError("horimetroFim")}
          </div>
          <div className="space-y-2" data-error={submitted && !!errors.horasLiq}>
            <Label>
              Horas líquidas (HH:MM) <span className="text-destructive">*</span>
            </Label>
            <Input
              type="time"
              name="horasLiquidas"
              value={horasLiquidas}
              onChange={(e) => setHorasLiquidas(e.target.value)}
              className={cn(submitted && errors.horasLiq && "border-destructive")}
            />
            {submitted && fieldError("horasLiq")}
          </div>
        </div>
      </div>

      {/* Tipo de Emprego */}
      <div className={sectionClass(!!errors.emprego)} data-error={submitted && !!errors.emprego}>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          Tipo de emprego <span className="text-destructive">*</span>
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="emp-direto"
              defaultChecked={initialData?.tiposEmprego?.includes("Combate direto")}
            />
            <label htmlFor="emp-direto" className="text-sm font-medium leading-none">
              Combate direto
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="emp-indireto"
              defaultChecked={initialData?.tiposEmprego?.includes("Combate indireto")}
            />
            <label htmlFor="emp-indireto" className="text-sm font-medium leading-none">
              Combate indireto
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="emp-recon"
              defaultChecked={initialData?.tiposEmprego?.includes("Reconhecimento")}
            />
            <label htmlFor="emp-recon" className="text-sm font-medium leading-none">
              Reconhecimento
            </label>
          </div>
        </div>
        {submitted && fieldError("emprego")}
      </div>

      {/* Área de Atuação */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          Área de Atuação da Equipe
        </h3>
        <div className="relative rounded-lg overflow-hidden border border-border h-[350px]">
          <SituationMapClient
            hideEvents={true}
            isolatedEventId={eventoFogoId}
            dispatchPin={despachoLat && despachoLng ? { lat: despachoLat, lng: despachoLng } : null}
            activePin={location ? { lat: location.lat, lng: location.lng } : null}
            onClickMap={(lat, lng) => setLocation({ lat, lng })}
            flyTo={despachoLat && despachoLng ? { lat: despachoLat, lng: despachoLng } : null}
            extraMarkers={
              fireEventLat && fireEventLng
                ? [
                    {
                      lat: fireEventLat,
                      lng: fireEventLng,
                      color: "#f97316",
                      tooltip: "Evento de Fogo",
                    },
                  ]
                : []
            }
          />
          <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-none">
            <div className="bg-background/80 backdrop-blur-sm border border-border text-xs px-2 py-1 rounded flex items-center gap-1 shadow-sm">
              <div className="w-2 h-2 rounded-full" style={{ background: "#3b82f6" }} /> Despacho
              Original
            </div>
            <div className="bg-background/80 backdrop-blur-sm border border-border text-xs px-2 py-1 rounded flex items-center gap-1 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-red-500" /> Local de Atuação
            </div>
            {fireEventLat && fireEventLng && (
              <div className="bg-background/80 backdrop-blur-sm border border-border text-xs px-2 py-1 rounded flex items-center gap-1 shadow-sm">
                <div className="w-2 h-2 rounded-full" style={{ background: "#f97316" }} /> Evento de
                Fogo
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Operação com Água */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          Operação com Água
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Quantidade de alijamentos realizados</Label>
            <Input
              type="number"
              name="qtdeLancamentos"
              placeholder="Qtd. de lançamentos"
              defaultValue={initialData?.qtdeLancamentos}
            />
          </div>
        </div>

        <div className={sectionClass(!!errors.usoAgua)} data-error={submitted && !!errors.usoAgua}>
          <Label>
            Houve uso de água na ocorrência? <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={usoAgua !== undefined ? (usoAgua ? "sim" : "nao") : undefined}
            onValueChange={(v) => setUsoAgua(v === "sim")}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id="agua-sim" />
              <Label htmlFor="agua-sim">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id="agua-nao" />
              <Label htmlFor="agua-nao">Não</Label>
            </div>
          </RadioGroup>
          {submitted && fieldError("usoAgua")}
        </div>

        {usoAgua && (
          <div className="space-y-4 pl-6 border-l-2 border-primary/30 pt-2">
            <div className="space-y-2 max-w-sm" data-error={submitted && !!errors.volumeAgua}>
              <Label>
                Quantidade (Litros) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                name="volumeAguaLitros"
                placeholder="Ex: 5000"
                defaultValue={initialData?.volumeAguaLitros}
                className={cn(submitted && errors.volumeAgua && "border-destructive")}
              />
              {submitted && fieldError("volumeAgua")}
            </div>

            <div className="space-y-2 pt-2" data-error={submitted && !!errors.origemAgua}>
              <Label>
                Origem da Água <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="oagua-curso"
                    defaultChecked={initialData?.origensAgua?.includes("Curso d'água natural")}
                  />
                  <label htmlFor="oagua-curso" className="text-sm font-medium leading-none">
                    Curso d'água natural (rio, lago, represa)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="oagua-hidrante"
                    defaultChecked={initialData?.origensAgua?.includes("Hidrante")}
                  />
                  <label htmlFor="oagua-hidrante" className="text-sm font-medium leading-none">
                    Hidrante
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="oagua-fixo"
                    defaultChecked={initialData?.origensAgua?.includes("Reservatório fixo")}
                  />
                  <label htmlFor="oagua-fixo" className="text-sm font-medium leading-none">
                    Reservatório fixo (cisterna, caixa d'água)
                  </label>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Checkbox
                    id="oagua-outro"
                    checked={outroAgua}
                    onCheckedChange={(c) => setOutroAgua(!!c)}
                  />
                  <label htmlFor="oagua-outro" className="text-sm font-medium leading-none">
                    Outro:
                  </label>
                  {outroAgua && (
                    <Input
                      name="outraOrigemAguaDescricao"
                      placeholder="Descreva"
                      className="h-8 ml-2 flex-1 max-w-[250px]"
                      required
                      defaultValue={initialData?.outraOrigemAguaDescricao}
                    />
                  )}
                </div>
              </div>
              {submitted && fieldError("origemAgua")}
            </div>
          </div>
        )}
      </div>

      {/* Efetividade e Reforço */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          Avaliação e Necessidades
        </h3>

        <div
          className={sectionClass(!!errors.efetividade)}
          data-error={submitted && !!errors.efetividade}
        >
          <Label>
            Efetividade estimada <span className="text-destructive">*</span>
          </Label>
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
          {submitted && fieldError("efetividade")}
        </div>

        <div
          className={sectionClass(!!errors.necessidadeReforco)}
          data-error={submitted && !!errors.necessidadeReforco}
        >
          <Label>
            Necessidade de reforço? <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={reforco !== undefined ? (reforco ? "sim" : "nao") : undefined}
            onValueChange={(v) => setReforco(v === "sim")}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id="ref-sim" />
              <Label htmlFor="ref-sim">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id="ref-nao" />
              <Label htmlFor="ref-nao">Não</Label>
            </div>
          </RadioGroup>
          {submitted && fieldError("necessidadeReforco")}
        </div>

        {reforco && (
          <div
            className={cn(
              "pl-6 border-l-2 border-warning/30 pt-2 space-y-3",
              submitted &&
                !!errors.reforcos &&
                "border-destructive/50 bg-destructive/5 p-2 rounded",
            )}
            data-error={submitted && !!errors.reforcos}
          >
            <Label className="text-muted-foreground">
              Selecione os reforços necessários: <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ref-ter"
                  defaultChecked={initialData?.tiposReforcoNecessarios?.includes(
                    "Mais equipes terrestres",
                  )}
                />
                <label htmlFor="ref-ter" className="text-sm leading-none">
                  Mais equipes terrestres
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ref-aer"
                  defaultChecked={initialData?.tiposReforcoNecessarios?.includes("Apoio aéreo")}
                />
                <label htmlFor="ref-aer" className="text-sm leading-none">
                  Apoio aéreo
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ref-maq"
                  defaultChecked={initialData?.tiposReforcoNecessarios?.includes(
                    "Maquinário pesado",
                  )}
                />
                <label htmlFor="ref-maq" className="text-sm leading-none">
                  Maquinário pesado
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ref-sci"
                  defaultChecked={initialData?.tiposReforcoNecessarios?.includes(
                    "Implantação do SCI",
                  )}
                />
                <label htmlFor="ref-sci" className="text-sm leading-none">
                  Implantação do SCI
                </label>
              </div>
            </div>
            {submitted && fieldError("reforcos")}
          </div>
        )}
      </div>

      {/* Histórico e Resultado */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          Histórico e Resultado
        </h3>

        <div className="space-y-2" data-error={submitted && !!errors.historico}>
          <Label>
            Histórico descritivo <span className="text-destructive">*</span>
          </Label>
          <Textarea
            name="historicoDescritivo"
            placeholder="Descreva de forma livre os detalhes da operação aérea..."
            className={cn("min-h-[120px]", submitted && errors.historico && "border-destructive")}
            defaultValue={initialData?.historicoDescritivo}
          />
          {submitted && fieldError("historico")}
        </div>

        <div
          className={sectionClass(!!errors.resultado)}
          data-error={submitted && !!errors.resultado}
        >
          <Label>
            Resultado da ocorrência <span className="text-destructive">*</span>
          </Label>
          <RadioGroup value={resultado} onValueChange={setResultado} className="space-y-3">
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="andamento" id="res-and" className="mt-0.5" />
              <Label htmlFor="res-and" className="leading-tight">
                Em andamento{" "}
                <span className="text-muted-foreground font-normal">
                  (Combate ativo no momento do preenchimento, sem extinção total.)
                </span>
              </Label>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="extinto" id="res-ext" className="mt-0.5" />
              <Label htmlFor="res-ext" className="leading-tight">
                Incêndio extinto pela agência / Resolvida{" "}
                <span className="text-muted-foreground font-normal">
                  (Equipe concluiu o combate e confirmou extinção completa do fogo.)
                </span>
              </Label>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="outro" id="res-out" className="mt-0.5" />
              <Label htmlFor="res-out" className="leading-tight whitespace-nowrap">
                Outro:
              </Label>
              {resultado === "outro" && (
                <Input
                  name="outroResultadoDescricao"
                  className="h-7 text-xs flex-1 ml-2 max-w-[300px]"
                  placeholder="Especifique..."
                  required
                  defaultValue={initialData?.outroResultadoDescricao}
                />
              )}
            </div>
          </RadioGroup>
          {submitted && fieldError("resultado")}
        </div>
      </div>

      {/* Anexos */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          Anexos e Documentação Visual
        </h3>
        <FileUploader
          label="Anexar Fotos, Relatórios em PDF, Mapas KML ou Documentos"
          initialUrls={initialData?.anexos?.map((a: any) => a.url) || []}
          onChange={(files) => onFilesChange && onFilesChange("anexos", files)}
          onRemoveInitial={onFileRemove}
        />
      </div>
    </form>
  );
}
