import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

export interface UseEffectiveCompanyResult {
  effectiveCompanyId: string | undefined;
  isSuperAdmin: boolean;
  hasCompanySelected: boolean;
  selectedCompany: ReturnType<typeof useCompany>['selectedCompany'];
}

export const useEffectiveCompany = (): UseEffectiveCompanyResult => {
  const { user } = useAuth();
  const { selectedCompany, effectiveCompanyId } = useCompany();

  const isSuperAdmin = user?.role === 'superAdmin';
  const hasCompanySelected = isSuperAdmin ? !!selectedCompany : !!user?.companyId;

  return {
    effectiveCompanyId,
    isSuperAdmin,
    hasCompanySelected,
    selectedCompany,
  };
};

export default useEffectiveCompany;
