import { Map, ClipboardList, Users, User, Flame, Plus } from "lucide-react";
import { useState } from "react";

const tabs = [
  { id: "mapa", label: "Mapa", icon: Map },
  { id: "os", label: "OS", icon: ClipboardList },
  { id: "equipes", label: "Equipes", icon: Users },
  { id: "perfil", label: "Perfil", icon: User },
] as const;

export function MobileBottomNav() {
  const [active, setActive] = useState<string>("mapa");
  const [fabOpen, setFabOpen] = useState(false);

  return (
    <>
      {/* FAB */}
      <div className="lg:hidden fixed right-4 bottom-20 z-40 flex flex-col items-end gap-2">
        {fabOpen && (
          <>
            <button className="glass-strong rounded-full pl-3 pr-4 h-10 flex items-center gap-2 text-xs font-medium">
              <Flame className="h-4 w-4 text-fire" /> Reportar Fogo
            </button>
            <button className="glass-strong rounded-full pl-3 pr-4 h-10 flex items-center gap-2 text-xs font-medium">
              <ClipboardList className="h-4 w-4 text-command" /> Criar OS
            </button>
          </>
        )}
        <button
          onClick={() => setFabOpen((v) => !v)}
          className="h-14 w-14 rounded-full bg-fire text-primary-foreground shadow-lg shadow-fire/30 grid place-items-center pulse-fire"
          aria-label="Ações rápidas"
        >
          <Plus className={`h-6 w-6 transition-transform ${fabOpen ? "rotate-45" : ""}`} />
        </button>
      </div>

      {/* Bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border">
        <div className="grid grid-cols-4 h-16 pb-[env(safe-area-inset-bottom)]">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className="relative flex flex-col items-center justify-center gap-1 text-[10px] mono"
              >
                {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-fire" />}
                <Icon className={`h-5 w-5 ${isActive ? "text-fire" : "text-muted-foreground"}`} />
                <span className={isActive ? "text-foreground" : "text-muted-foreground"}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
