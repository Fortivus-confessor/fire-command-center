import type { ReactNode } from "react";
import { useCanAccess } from "../../hooks/useCanAccess";
import type { Resource, Action } from "../../lib/roles";

export function RoleGate({
  resource,
  action,
  children,
  fallback,
}: {
  resource: Resource;
  action: Action;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const allowed = useCanAccess(resource, action);
  if (!allowed) return fallback ?? null;
  return <>{children}</>;
}
