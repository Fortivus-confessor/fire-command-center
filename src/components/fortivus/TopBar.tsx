import { useState } from 'react';
import { Activity, Bell, Menu, Radio, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS, ALL_ROLES, type UserRole } from '../../lib/roles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MobileSidebar } from './Sidebar';

export function TopBar() {
  const { user, role, setMockRole, isAuthenticated, login, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <MobileSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
      <header className="sticky top-0 z-40 glass-strong">
        <div className="flex items-center justify-between px-3 sm:px-5 h-14">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden h-9 w-9 grid place-items-center rounded-md border border-border bg-secondary/60 hover:bg-secondary transition"
              aria-label="Abrir menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Logo (visible on mobile only since sidebar has it on desktop) */}
            <div className="lg:hidden flex items-center gap-2 min-w-0">
              <div className="relative h-7 w-7 shrink-0">
                <img src="/icone_fortivus_oficial.png" alt="Fortivus Logo" className="h-full w-full object-contain" />
                <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-fire pulse-fire" />
              </div>
              <span className="text-sm font-semibold tracking-wide truncate">FORTIVUS</span>
            </div>

            {/* Operational info (desktop) */}
            <div className="hidden lg:block min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground mono truncate">
                COMCEN-BR · OP-INC-2026-Q2 · SEC-3
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* System status */}
            <div className="hidden md:flex items-center gap-2 mono text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-success" />
              <span>LINK 99.8%</span>
              <span className="text-border">|</span>
              <Radio className="h-3.5 w-3.5 text-command" />
              <span>VHF-7 OK</span>
            </div>

            {/* Role selector (desktop - dev tool) */}
            <div className="hidden lg:block">
              {role && (
                <Select value={role} onValueChange={(v) => setMockRole(v as UserRole)}>
                  <SelectTrigger className="h-8 w-[160px] text-[11px] mono bg-secondary/40 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Notifications */}
            <button className="relative h-9 w-9 grid place-items-center rounded-md border border-border bg-secondary/60 hover:bg-secondary transition">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-fire" />
            </button>

            {/* User avatar */}
            {isAuthenticated && user && role ? (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border cursor-pointer hover:opacity-80 transition" onClick={logout}>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-command to-accent grid place-items-center text-[11px] font-semibold">
                  {user.nome
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-medium">{user.nome}</p>
                  <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[role]}</p>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center pl-2 border-l border-border">
                <button onClick={login} className="text-xs font-medium text-command hover:underline">
                  Fazer Login
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}