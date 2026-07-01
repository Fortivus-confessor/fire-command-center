import { ClipboardList, Plane, Truck, Wrench, Plus, ChevronRight } from "lucide-react";
import { ordens, fires, type OrdemServico } from "./data";

const tipoIcon = {
  Terrestre: Truck,
  Aéreo: Plane,
  Maquinário: Wrench,
} as const;

const statusColor: Record<OrdemServico["status"], string> = {
  "Em execução": "text-success border-success/40 bg-success/10",
  Aprovada: "text-command border-command/40 bg-command/10",
  Rascunho: "text-muted-foreground border-border bg-secondary/60",
};

const prioColor: Record<OrdemServico["prioridade"], string> = {
  P1: "bg-fire text-primary-foreground",
  P2: "bg-warning text-background",
  P3: "bg-command text-background",
};

interface Props {
  selectedFireId: string;
}

import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "../../lib/api";

export function OrdersColumn({ selectedFireId }: Props) {
  const fire = fires.find((f) => f.id === selectedFireId);
  const { data: ordens = [], isLoading } = useQuery({
    queryKey: ["ordens"],
    queryFn: () => fetchWithAuth("/operacional/os"),
  });

  return (
    <section className="glass rounded-xl flex flex-col h-full min-h-0">
      <header className="px-3 sm:px-4 pt-3 pb-2 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ClipboardList className="h-4 w-4 text-command shrink-0" />
            <h2 className="text-sm font-semibold truncate">Ordens de Serviço</h2>
            <span className="text-[10px] mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
              PLANEJAMENTO
            </span>
          </div>
          <button className="h-7 px-2 grid place-items-center rounded border border-command/50 text-command text-[11px] mono hover:bg-command/10">
            + Nova OS
          </button>
        </div>
      </header>

      {/* Draft / creator linked to selected event */}
      {fire && (
        <div className="mx-3 sm:mx-4 mt-3 rounded-lg border border-dashed border-command/40 bg-command/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-widest text-command mono">
              Criar OS a partir do evento
            </p>
            <span className="mono text-[10px] text-muted-foreground">{fire.codigo}</span>
          </div>
          <p className="text-sm font-medium mt-1">
            {fire.municipio}/{fire.uf} · {fire.bioma}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {(["Terrestre", "Aéreo", "Maquinário"] as const).map((t) => {
              const Icon = tipoIcon[t];
              return (
                <button
                  key={t}
                  className="flex flex-col items-center justify-center gap-1 py-2 rounded-md border border-border bg-secondary/60 hover:border-command hover:text-command transition"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] mono">{t}</span>
                </button>
              );
            })}
          </div>
          <button className="mt-3 w-full h-9 rounded-md bg-command text-background text-xs font-semibold hover:opacity-90 transition flex items-center justify-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Despachar OS
          </button>
        </div>
      )}

      <div className="overflow-y-auto flex-1 min-h-0 px-3 sm:px-4 py-3 space-y-2">
        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-4">Carregando ordens...</div>
        ) : ordens.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            Nenhuma ordem de serviço.
          </div>
        ) : (
          ordens.map((o: any) => (
            <article
              key={o.id}
              className="rounded-lg border border-border bg-secondary/40 hover:bg-secondary/70 transition p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] mono px-1.5 py-0.5 rounded ${prioColor["P2"]}`}>
                      P2
                    </span>
                    <span className="mono text-[11px] text-muted-foreground">OS-{o.id}</span>
                  </div>
                  <p className="text-sm font-medium mt-1 truncate">
                    {o.localizacaoTexto || "Sem local"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mono mt-0.5">
                    Vinc. Foco-000 · ID Resp: {o.relatorId || "N/A"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {/* Fallback to Terrestre for now */}
                  {["Terrestre"].map((t: any) => {
                    const Icon = tipoIcon[t as keyof typeof tipoIcon];
                    return (
                      <span
                        key={t}
                        className="flex items-center gap-1 text-[10px] mono px-1.5 py-0.5 rounded border border-border bg-background/40"
                      >
                        <Icon className="h-3 w-3" />
                        {t}
                      </span>
                    );
                  })}
                </div>
                <span
                  className={`text-[10px] mono uppercase tracking-wider px-1.5 py-0.5 rounded border text-muted-foreground border-border bg-secondary/60`}
                >
                  {o.status || "Rascunho"}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mono mt-2">
                criada em {new Date(o.dataCriacao).toLocaleDateString("pt-BR")}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
