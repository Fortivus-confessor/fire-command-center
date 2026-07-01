import { Battery, Fuel, Radio, Truck, Users } from "lucide-react";
import { equipes, type EquipeStatus } from "./data";

const statusDot: Record<EquipeStatus, string> = {
  "No combate": "bg-fire",
  "Em deslocamento": "bg-command",
  Retornando: "bg-warning",
  Standby: "bg-muted-foreground",
};

const statusBadge: Record<EquipeStatus, string> = {
  "No combate": "text-fire border-fire/40 bg-fire/10",
  "Em deslocamento": "text-command border-command/40 bg-command/10",
  Retornando: "text-warning border-warning/40 bg-warning/10",
  Standby: "text-muted-foreground border-border bg-secondary/60",
};

function Bar({ value, tone }: { value: number; tone: "fire" | "command" | "success" }) {
  const color = tone === "fire" ? "bg-fire" : tone === "command" ? "bg-command" : "bg-success";
  return (
    <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "../../lib/api";

export function DispatchColumn() {
  const { data: equipes = [], isLoading } = useQuery({
    queryKey: ["equipes"],
    queryFn: () => fetchWithAuth("/admin/equipes"),
  });

  return (
    <section className="glass rounded-xl flex flex-col h-full min-h-0">
      <header className="px-3 sm:px-4 pt-3 pb-2 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="h-4 w-4 text-success shrink-0" />
            <h2 className="text-sm font-semibold truncate">Despachos</h2>
            <span className="text-[10px] mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
              OPERACIONAL · {equipes.length}
            </span>
          </div>
          <span className="text-[10px] mono text-success">● LIVE</span>
        </div>
      </header>
      <div className="overflow-y-auto flex-1 min-h-0 px-3 sm:px-4 py-3 space-y-2">
        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            Carregando equipes...
          </div>
        ) : equipes.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            Nenhuma equipe disponível.
          </div>
        ) : (
          equipes.map((e: any) => (
            <article
              key={e.id}
              className="rounded-lg border border-border bg-secondary/40 hover:bg-secondary/70 transition p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${statusDot["Standby"]}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{e.nome}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{e.categoria}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] mono uppercase tracking-wider px-1.5 py-0.5 rounded border whitespace-nowrap ${statusBadge["Standby"]}`}
                >
                  Standby
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Truck className="h-3 w-3" />
                  <span className="truncate">Sem Vtr</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground justify-end">
                  <Users className="h-3 w-3" />
                  <span className="mono">0 efetivos</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] mono text-muted-foreground">
                <span className="border border-border rounded px-1.5 py-0.5">N/A</span>
                <span>CC {e.centroComandoId || "N/A"}</span>
                <span>ETA —</span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between text-[10px] mono text-muted-foreground mb-1">
                    <span className="flex items-center gap-1">
                      <Fuel className="h-3 w-3" /> Comb.
                    </span>
                    <span>100%</span>
                  </div>
                  <Bar value={100} tone="command" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px] mono text-muted-foreground mb-1">
                    <span className="flex items-center gap-1">
                      <Battery className="h-3 w-3" /> Rádio
                    </span>
                    <span>100%</span>
                  </div>
                  <Bar value={100} tone="success" />
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
