import { useAuth } from '../contexts/AuthContext';
import { canAccess, type Resource, type Action } from '../lib/roles';

export function useCanAccess(resource: Resource, action: Action): boolean {
  const { role } = useAuth();
  if (!role) return false;
  return canAccess(role, resource, action);
}
