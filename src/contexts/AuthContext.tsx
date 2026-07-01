import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User, UserRole } from "../lib/roles";
// Import dinâmico do Keycloak para evitar quebra no SSR

let keycloakInstance: any = null;
let initPromise: Promise<boolean> | null = null;

async function getKeycloak() {
  if (typeof window === "undefined") return null;
  if (!keycloakInstance) {
    const { default: Keycloak } = await import("keycloak-js");
    keycloakInstance = new Keycloak({
      url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:9000",
      realm: "fortivus",
      clientId: "fortivus-web",
    });
  }
  return keycloakInstance;
}

export { getKeycloak };

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  centroComandoId?: string;
  isAuthenticated: boolean;
  isInitialized: boolean;
  logout: () => void;
  login: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function initAuth() {
      const kc = await getKeycloak();
      if (!kc) return; // SSR

      if (!initPromise) {
        initPromise = kc.init({
          onLoad: "check-sso",
          checkLoginIframe: false,
          silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html",
          silentCheckSsoFallback: false,
        });
      }

      try {
        const authenticated = await initPromise!;
        setIsAuthenticated(authenticated);
        if (authenticated && kc.tokenParsed) {
          const realmRoles = kc.tokenParsed.realm_access?.roles || [];
          let primaryRole: UserRole = "COMBATENTE";
          if (realmRoles.includes("ROLE_ADMIN")) primaryRole = "ADMIN";
          else if (realmRoles.includes("ROLE_CENTRO_COMANDO_CENTRAL"))
            primaryRole = "CENTRO_COMANDO_CENTRAL";
          else if (realmRoles.includes("ROLE_CENTRO_COMANDO")) primaryRole = "CENTRO_COMANDO";

          setUser({
            id: kc.tokenParsed.sub || "unknown",
            nome: kc.tokenParsed.name || kc.tokenParsed.preferred_username || "Usuário",
            email: kc.tokenParsed.email || "",
            role: primaryRole,
            centroComandoId: "cc1",
            centroComandoNome: "COMCEN Mato Grosso",
          });
          setRole(primaryRole);
        }
      } catch (e) {
        console.warn("Keycloak init error (check-sso):", e);
      } finally {
        setIsInitialized(true);
      }
    }

    initAuth();
  }, []);

  const login = async () => {
    const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:9000";
    const kc = await getKeycloak();
    if (!kc) {
      window.location.href = `${keycloakUrl}/realms/fortivus/protocol/openid-connect/auth?client_id=fortivus-web&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=code&scope=openid`;
      return;
    }
    try {
      await kc.login();
    } catch (err) {
      console.error("Failed to execute login:", err);
      window.location.href = `${keycloakUrl}/realms/fortivus/protocol/openid-connect/auth?client_id=fortivus-web&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=code&scope=openid`;
    }
  };
  const logout = async () => {
    const kc = await getKeycloak();
    kc?.logout();
  };

  // Removed hydration breaking conditional:
  // if (!isInitialized && typeof window !== 'undefined') {
  //   return <div className="flex h-screen items-center justify-center bg-background text-foreground">Carregando autenticação...</div>;
  // }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        centroComandoId: user?.centroComandoId,
        isAuthenticated,
        isInitialized,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
