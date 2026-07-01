import { timeline } from "./data";

const toneColor = {
  fire: "border-fire bg-fire",
  command: "border-command bg-command",
  success: "border-success bg-success",
  muted: "border-muted-foreground bg-muted-foreground",
} as const;

export function Timeline() {
  return (
    <div className="glass rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Timeline do evento</h3>
        <span className="text-[10px] mono text-muted-foreground">FOC-24811 · ALTA FLORESTA/MT</span>
      </div>
      <ol className="relative">
        <span className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
        {timeline.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            Nenhuma timeline registrada.
          </div>
        ) : (
          timeline.map((t, i) => (
            <li key={i} className="relative pl-6 pb-3 last:pb-0">
              <span
                className={`absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 ring-2 ring-background ${toneColor[t.tone]}`}
              />
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs">{t.label}</p>
                <span className="mono text-[10px] text-muted-foreground shrink-0">{t.t}</span>
              </div>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}
