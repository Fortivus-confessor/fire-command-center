import { useState } from "react";
import { Bell, Menu } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { ROLE_LABELS } from "../../lib/roles";
import { MobileSidebar } from "./Sidebar";
import { Link } from "@tanstack/react-router";

export function TopBar() {
  const { user, role, isAuthenticated, login } = useAuth();
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
                <img
                  src="/icone_fortivus_oficial.png"
                  alt="Fortivus Logo"
                  className="h-full w-full object-contain"
                />
                <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-fire pulse-fire" />
              </div>
              <span className="text-sm font-semibold tracking-wide truncate">FORTIVUS</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* User avatar */}
            {isAuthenticated && user && role ? (
              <Link
                to="/perfil"
                className="hidden sm:flex items-center gap-2 pl-2 border-l border-border cursor-pointer hover:opacity-80 transition"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-command to-accent grid place-items-center text-[11px] font-semibold">
                  {user.nome
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-medium">{user.nome}</p>
                  <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[role]}</p>
                </div>
              </Link>
            ) : (
              <div className="hidden sm:flex items-center pl-2 border-l border-border">
                <button
                  onClick={login}
                  className="text-xs font-medium text-command hover:underline"
                >
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
