import { useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface HasPermissionOptions {
  /** Also accept the `<code>.readonly` variant (use for view-only surfaces). */
  allowReadOnly?: boolean;
}

/**
 * RBAC permission checks, mirroring the backend `requirePermission` semantics:
 *  - superAdmin always passes;
 *  - a user with NO permission codes and the legacy `admin` role passes
 *    (transition fallback until every user carries a roleId);
 *  - otherwise the code (or its `.readonly` variant when allowed) must be granted.
 */
export function usePermissions() {
  const { user } = useAuth();

  const permissions = useMemo<string[]>(
    () => user?.permissions ?? [],
    [user?.permissions]
  );

  const isSuperAdmin = user?.role === 'superAdmin';

  const has = useCallback(
    (code: string, opts?: HasPermissionOptions): boolean => {
      if (!user) return false;
      if (isSuperAdmin) return true;
      if (permissions.length === 0 && user.role === 'admin') return true;
      if (permissions.includes(code)) return true;
      if (opts?.allowReadOnly && permissions.includes(`${code}.readonly`)) return true;
      return false;
    },
    [user, isSuperAdmin, permissions]
  );

  return { permissions, has, isSuperAdmin };
}

export default usePermissions;
