import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "../../lib/api";
import { Flame, Plane, Trees, Users, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Kpi {
  label: string;
  value: string | number;
  delta: string;
  tone: "fire" | "command" | "success" | "warning";
  icon: LucideIcon;
  hint: string;
}

const toneClasses = {
  fire: "text-fire",
  command: "text-command",
  success: "text-success",
  warning: "text-warning",
} as const;

export function KpiStrip() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["kpis"],
    queryFn: async () => {
      return fetchWithAuth("/dashboard/kpis");
    },
    // refetchInterval: 10000, // Optional: for real-time vibe
  });

  // Base KPIs (mock or fetched)
  const kpis: Kpi[] = [
    {
      label: "Eventos Ativos",
      value: data?.eventosAtivos ?? "...",
      delta: "+4 (1h)",
      tone: "fire",
      icon: Flame,
      hint: "Focos confirmados",
    },
    {
      label: "Equipes em Campo",
      value: data?.equipesCampo ?? "...",
      delta: "82% capacidade",
      tone: "command",
      icon: Users,
      hint: "Brigadistas & Helitack",
    },
    {
      label: "Ordens de Serviço",
      value: data?.osAbertas ?? "...",
      delta: "Abertas hoje",
      tone: "warning",
      icon: Activity,
      hint: "Despachos e Logística",
    },
    {
      label: "Ativos Operantes",
      value: data?.ativosOperantes ?? "...",
      delta: "Operação normal",
      tone: "success",
      icon: Plane,
      hint: "Veículos e Aeronaves",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {kpis.map((k) => {
        const Icon = k.icon;
        return (
          <div
            key={k.label}
            className="glass rounded-xl p-3 sm:p-4 relative overflow-hidden group hover:border-foreground/20 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground truncate">
                  {k.label}
                </p>
                <p className="mt-1 text-2xl sm:text-3xl font-semibold mono tracking-tight">
                  {isLoading ? "..." : k.value}
                </p>
              </div>
              <div
                className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-secondary/70 grid place-items-center ${toneClasses[k.tone]}`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className={`text-[10px] sm:text-xs mono ${toneClasses[k.tone]}`}>
                {k.delta}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">
                {k.hint}
              </span>
            </div>
            <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition" />
          </div>
        );
      })}
    </div>
  );
}
