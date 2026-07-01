import { Filter, Flame, Satellite, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "../../lib/api";

const riskBadge: Record<string, string> = {
  CRITICO: "bg-fire/15 text-fire border-fire/40",
  ALTO: "bg-warning/15 text-warning border-warning/40",
  MEDIO: "bg-command/15 text-command border-command/40",
  BAIXO: "bg-success/15 text-success border-success/40",
};

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function EventsColumn({ selectedId, onSelect }: Props) {
  const { data: rawData, isLoading } = useQuery({
    queryKey: ["focos"],
    queryFn: () =>
      fetch("/api/v1/fire-events/latest").then((res) => {
        if (!res.ok) return [];
        return res.json();
      }),
  });
  const focos = Array.isArray(rawData) ? rawData : [];

  return (
    <section className="glass rounded-xl flex flex-col h-full min-h-0">
      <header className="px-3 sm:px-4 pt-3 pb-2 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Flame className="h-4 w-4 text-fire shrink-0" />
            <h2 className="text-sm font-semibold truncate">Eventos de Fogo</h2>
            <span className="text-[10px] mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
              INBOX · {focos.length}
            </span>
          </div>
          <button className="h-7 w-7 grid place-items-center rounded border border-border hover:bg-secondary">
            <Filter className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 bg-secondary/60 border border-border rounded-md px-2 h-8">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Buscar município, código ou satélite…"
            className="bg-transparent text-xs flex-1 outline-none placeholder:text-muted-foreground"
          />
        </div>
      </header>
      <div className="overflow-y-auto flex-1 min-h-0 divide-y divide-border">
        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            Buscando focos no radar...
          </div>
        ) : focos.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            Nenhum evento detectado.
          </div>
        ) : (
          focos.map((f: any) => {
            const active = f.id === selectedId;
            return (
              <button
                key={f.id}
                onClick={() => onSelect(f.id)}
                className={`w-full text-left px-3 sm:px-4 py-3 transition relative ${active ? "bg-secondary/70" : "hover:bg-secondary/40"}`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-fire rounded-r" />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="mono text-[11px] text-muted-foreground">
                        {f.externalId?.substring(0, 10) || f.id.substring(0, 8)}
                      </span>
                      <span
                        className={`text-[10px] uppercase tracking-wider border rounded px-1.5 py-0.5 ${f.frp > 100 ? riskBadge.CRITICO : riskBadge.MEDIO}`}
                      >
                        {f.frp > 100 ? "EXTREMO" : "ALTO"}
                      </span>
                    </div>
                    <p className="text-sm font-medium mt-0.5 truncate">
                      NASA FIRMS{" "}
                      <span className="text-muted-foreground font-normal">/ Satélite</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <Satellite className="h-3 w-3" /> {f.satellite || "N/A"}
                      <span className="text-border">•</span>
                      <span className="mono">FRP {f.frp != null ? f.frp.toFixed(1) : "--"}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground mono">
                      {new Date(f.acquisitionDate).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-[11px] mono mt-0.5">
                      {f.confidence != null ? f.confidence : "--"}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] mono text-muted-foreground">
                  <span>Confiança: {f.confidence || "N/A"}</span>
                  <span>
                    {f.latitude?.toFixed(3)}, {f.longitude?.toFixed(3)}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
