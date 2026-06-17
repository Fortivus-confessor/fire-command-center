import { Compass, Crosshair, Layers, Maximize2, Minus, Plus } from "lucide-react";
import { fires, type FireEvent } from "./data";

const riskColor: Record<FireEvent["risco"], string> = {
  extremo: "var(--fire)",
  alto: "var(--warning)",
  medio: "var(--command)",
  baixo: "var(--success)",
};

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function SituationMap({ selectedId, onSelect }: Props) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-secondary/40 grid-bg">
      {/* Stylized landmass shapes */}
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-60">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--command)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--command)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="60" fill="url(#glow)" />
        {/* Brazil-ish silhouette */}
        <path
          d="M28,12 C38,8 52,9 62,12 C72,15 78,22 80,30 C82,40 75,48 66,52 C56,56 44,55 36,50 C28,46 22,38 22,28 C22,22 24,16 28,12 Z"
          fill="color-mix(in oklab, var(--command) 12%, transparent)"
          stroke="color-mix(in oklab, var(--command) 35%, transparent)"
          strokeWidth="0.25"
        />
        <path
          d="M40,18 C50,16 60,18 66,24 M30,32 C42,30 56,32 70,36 M36,44 C48,42 60,44 68,42"
          fill="none"
          stroke="color-mix(in oklab, var(--command) 25%, transparent)"
          strokeWidth="0.15"
          strokeDasharray="0.6 0.6"
        />
      </svg>

      {/* Scan sweep */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-0 right-0 h-12 scan-line" />
      </div>

      {/* Fire markers */}
      {fires.map((f) => {
        const active = f.id === selectedId;
        const color = riskColor[f.risco];
        return (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            style={{ left: `${f.x * 100}%`, top: `${f.y * 100}%`, color }}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            aria-label={`${f.codigo} ${f.municipio}`}
          >
            <span
              className={`absolute inset-0 -m-3 rounded-full ${f.risco === "extremo" ? "pulse-fire" : ""}`}
              style={{ backgroundColor: "transparent" }}
            />
            <span
              className="block h-3 w-3 rounded-full ring-2 ring-background"
              style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
            />
            <span
              className={`absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-60 ${active ? "scale-150" : "scale-100"} transition`}
              style={{ borderColor: color }}
            />
            <span
              className={`absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] mono px-1.5 py-0.5 rounded border bg-background/80 transition ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
              style={{ borderColor: color, color }}
            >
              {f.codigo} · {f.municipio}/{f.uf}
            </span>
          </button>
        );
      })}

      {/* HUD overlays */}
      <div className="absolute top-3 left-3 glass rounded-lg px-2.5 py-1.5 text-[10px] mono text-muted-foreground flex items-center gap-2">
        <Compass className="h-3.5 w-3.5 text-command" />
        <span>LAT -10.42° · LNG -52.08°</span>
        <span className="text-border">|</span>
        <span>ZOOM 5.6</span>
      </div>

      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
        <button className="glass h-8 w-8 grid place-items-center rounded-md hover:bg-secondary"><Plus className="h-4 w-4" /></button>
        <button className="glass h-8 w-8 grid place-items-center rounded-md hover:bg-secondary"><Minus className="h-4 w-4" /></button>
        <button className="glass h-8 w-8 grid place-items-center rounded-md hover:bg-secondary"><Crosshair className="h-4 w-4" /></button>
        <button className="glass h-8 w-8 grid place-items-center rounded-md hover:bg-secondary"><Layers className="h-4 w-4" /></button>
        <button className="glass h-8 w-8 grid place-items-center rounded-md hover:bg-secondary"><Maximize2 className="h-4 w-4" /></button>
      </div>

      <div className="absolute bottom-3 left-3 glass rounded-lg px-2.5 py-2 text-[10px] mono space-y-1">
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: "var(--fire)" }} />Extremo · FRP &gt; 300</div>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: "var(--warning)" }} />Alto · FRP 100–300</div>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: "var(--command)" }} />Médio</div>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: "var(--success)" }} />Baixo</div>
      </div>

      <div className="absolute bottom-3 right-3 glass rounded-lg px-2.5 py-1.5 text-[10px] mono text-muted-foreground">
        Fonte: BDQueimadas / INPE · t-00:02:14
      </div>
    </div>
  );
}