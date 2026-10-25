import { useEffect, useState } from 'react';
import { Role } from '../types';
import { rolesApi } from '../services/api';
import { logger } from '../utils/logger';

/**
 * Roles the current actor may assign (`GET /api/roles?assignable=true`).
 * `companyId` is only needed for a superAdmin acting on a specific company;
 * a company actor's own company comes from the JWT and the param is omitted.
 * `enabled: false` skips the request (superAdmin with no company selected).
 */
export function useAssignableRoles(companyId?: string, enabled: boolean = true) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setRoles([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    rolesApi
      .getRoles({ assignable: true, ...(companyId ? { companyId } : {}), limit: 100 })
      .then((r) => {
        if (!cancelled) setRoles(r.data);
      })
      .catch((err: unknown) => {
        logger.error('Failed to load assignable roles:', err);
        if (!cancelled) setRoles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, enabled]);

  return { roles, loading };
}

export default useAssignableRoles;
