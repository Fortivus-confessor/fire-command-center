export type UserRole = "ADMIN" | "CENTRO_COMANDO_CENTRAL" | "CENTRO_COMANDO" | "COMBATENTE";

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  centroComandoId?: string;
  centroComandoNome?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  CENTRO_COMANDO_CENTRAL: "Centro de Comando Central",
  CENTRO_COMANDO: "Centro de Comando",
  COMBATENTE: "Combatente",
};

export const ALL_ROLES: UserRole[] = [
  "ADMIN",
  "CENTRO_COMANDO_CENTRAL",
  "CENTRO_COMANDO",
  "COMBATENTE",
];

export type Resource =
  | "ordens-servico"
  | "despachos"
  | "eventos-fogo"
  | "equipes"
  | "centro-comando"
  | "escalas"
  | "usuarios"
  | "veiculos";
export type Action = "view" | "create" | "edit" | "delete";

/**
 * Permissions matrix — determines whether a given role can perform
 * a specific action on a resource. Scope filtering (e.g. "only their
 * own centro de comando") is handled at the data layer, not here.
 */
export function canAccess(role: UserRole, resource: Resource, action: Action): boolean {
  // ADMIN and CENTRO_COMANDO_CENTRAL can do everything
  if (role === "ADMIN" || role === "CENTRO_COMANDO_CENTRAL") return true;

  // CENTRO_COMANDO can do everything in their scope (filtering happens in data layer)
  if (role === "CENTRO_COMANDO") {
    if (resource === "centro-comando" && action !== "view") return false;
    if (resource === "veiculos" && action !== "view") return false;
    if (resource === "despachos" && action !== "view") return false;
    if (resource === "usuarios") return false;
    return true;
  }

  // COMBATENTE: only view their own OS and dispatches, and respond to dispatches
  if (role === "COMBATENTE") {
    if (resource === "ordens-servico") return action === "view";
    if (resource === "despachos") return action === "view" || action === "edit"; // edit is respond
    return false;
  }

  return false;
}
