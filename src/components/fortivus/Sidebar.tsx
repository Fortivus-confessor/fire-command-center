import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Map,
  Flame,
  ClipboardList,
  Truck,
  Users,
  Building2,
  Calendar,
  UserCog,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { canAccess, ROLE_LABELS, type Resource } from "../../lib/roles";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_ROLES, type UserRole } from "../../lib/roles";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Map;
  resource?: Resource;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", icon: Map },
  { to: "/usuarios", label: "Usuários", icon: UserCog, resource: "usuarios" },
  {
    to: "/centro-comando",
    label: "Centro de Comando",
    icon: Building2,
    resource: "centro-comando",
  },
  { to: "/equipes", label: "Equipes", icon: Users, resource: "equipes" },
  { to: "/veiculos", label: "Veículos", icon: Truck, resource: "veiculos" },
  { to: "/escalas", label: "Escalas", icon: Calendar, resource: "escalas" },
  { to: "/eventos-fogo", label: "Eventos de Fogo", icon: Flame, resource: "eventos-fogo" },
  {
    to: "/ordens-servico",
    label: "Ordens de Serviço",
    icon: ClipboardList,
    resource: "ordens-servico",
  },
  { to: "/despachos", label: "Despachos", icon: Truck, resource: "despachos" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, role } = useAuth();
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.resource) return true; // Home is always visible
    if (!role) return false;
    return canAccess(role, item.resource, "view");
  });

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen glass-strong border-r border-border transition-all duration-300 shrink-0 z-30 group relative",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      {/* Collapse toggle flutuante */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-40 hover:bg-secondary text-muted-foreground hover:text-foreground"
        aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <div className="relative h-8 w-8 shrink-0">
          <img
            src="/icone_fortivus_oficial.png"
            alt="Fortivus"
            className="h-full w-full object-contain drop-shadow-md"
          />
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-fire pulse-fire" />
        </div>
        {!collapsed && (
          <div className="min-w-0 overflow-hidden">
            <h2 className="text-sm font-bold tracking-widest truncate">FORTIVUS</h2>
            <p className="text-[10px] text-muted-foreground mono truncate">Mission Control</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <TooltipProvider delayDuration={0}>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);

            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 h-10 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-fire/15 text-foreground border border-fire/20"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    <Icon className={cn("h-4.5 w-4.5 shrink-0", isActive ? "text-fire" : "")} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="glass-strong">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>
      </TooltipProvider>
    </aside>
  );
}

// ─── Mobile Sidebar (Sheet) ───────────────────────────────────────────────────
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function MobileSidebar({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, role } = useAuth();
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.resource) return true;
    if (!role) return false;
    return canAccess(role, item.resource, "view");
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] glass-strong p-0 border-r border-border">
        <SheetHeader className="px-4 h-14 flex flex-row items-center gap-3 border-b border-border">
          <div className="relative h-8 w-8 shrink-0">
            <img
              src="/fortivus-logo.png"
              alt="Fortivus"
              className="h-full w-full object-contain drop-shadow-md"
            />
          </div>
          <SheetTitle className="text-sm font-bold tracking-widest">FORTIVUS</SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 h-10 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-fire/15 text-foreground border border-fire/20"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4.5 w-4.5 shrink-0", isActive ? "text-fire" : "")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border p-3 space-y-3">
          {user && role && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-command to-accent grid place-items-center text-[11px] font-semibold shrink-0">
                {user.nome
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{user.nome}</p>
                <p className="text-[10px] text-muted-foreground truncate">{ROLE_LABELS[role]}</p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
